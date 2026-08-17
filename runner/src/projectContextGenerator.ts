import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { promisify } from "node:util";

import type { OperationalStore } from "./db/index.js";
import {
  PROJECT_CONTEXT_SCHEMA_VERSION,
  SKILL_EVIDENCE_SCHEMA_VERSION,
  type ProjectContextBundle,
  type ProjectContextSource,
} from "./skills/contracts.js";

const execFileAsync = promisify(execFile);
const MAX_FILES = 128;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_VISITED_ENTRIES = 2048;
const ROOT_FILES = new Set([
  "AGENTS.md", "ENVIRONMENT.md", "README.md", "Cargo.toml", "package.json",
  "pubspec.yaml", "pyproject.toml", "requirements.txt",
]);
const ARTIFACT_EXTENSIONS = new Set([".json", ".md", ".yaml", ".yml"]);

type ContextStore = Pick<OperationalStore,
  "getLatestProjectContextBundle" | "persistSkillEvidenceEnvelope" | "ensureLocalProjectContextTarget">;

export interface LocalProjectContextSource {
  resolveLocalRepository(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
  }): string | null;
}

export class ProjectContextGenerationError extends Error {
  constructor(readonly code: "localSourceUnavailable" | "contextBoundaryViolation" | "contextLimitExceeded", message: string) {
    super(message);
    this.name = "ProjectContextGenerationError";
  }
}

function within(root: string, target: string): boolean {
  const child = relative(root, target);
  return child === "" || (!child.startsWith("..") && !isAbsolute(child));
}

function opaqueReference(kind: ProjectContextSource["kind"], relativePath: string): string {
  const id = createHash("sha256").update(relativePath.replaceAll("\\", "/")).digest("hex").slice(0, 24);
  return `${kind}:${id}`;
}

function collectFiles(repositoryRoot: string): readonly { path: string; relativePath: string; kind: ProjectContextSource["kind"] }[] {
  const root = realpathSync(repositoryRoot);
  const files: { path: string; relativePath: string; kind: ProjectContextSource["kind"] }[] = [];
  let visitedEntries = 0;

  const add = (candidate: string, relativePath: string, kind: ProjectContextSource["kind"]): void => {
    const metadata = lstatSync(candidate);
    if (metadata.isSymbolicLink()) {
      throw new ProjectContextGenerationError("contextBoundaryViolation", "Symbolic links are not accepted as project context sources.");
    }
    const canonical = realpathSync(candidate);
    if (!within(root, canonical)) {
      throw new ProjectContextGenerationError("contextBoundaryViolation", "A project context source escaped the repository boundary.");
    }
    if (!metadata.isFile()) return;
    if (metadata.size > MAX_FILE_BYTES) {
      throw new ProjectContextGenerationError("contextLimitExceeded", "A project context source exceeds the per-file size limit.");
    }
    files.push({ path: canonical, relativePath, kind });
    if (files.length > MAX_FILES) {
      throw new ProjectContextGenerationError("contextLimitExceeded", "The project context contains too many sources.");
    }
  };

  for (const name of [...ROOT_FILES].sort()) {
    const candidate = resolve(root, name);
    try {
      add(candidate, name, "repositorySnapshot");
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") continue;
      throw error;
    }
  }

  const artifactsRoot = resolve(root, "shipglows_data");
  try {
    const rootMetadata = lstatSync(artifactsRoot);
    if (rootMetadata.isSymbolicLink()) {
      throw new ProjectContextGenerationError("contextBoundaryViolation", "The ShipGlows context directory cannot be a symbolic link.");
    }
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
        visitedEntries += 1;
        if (visitedEntries > MAX_VISITED_ENTRIES) {
          throw new ProjectContextGenerationError("contextLimitExceeded", "The ShipGlows context tree exceeds the traversal limit.");
        }
        const candidate = resolve(directory, entry.name);
        if (entry.isSymbolicLink()) {
          throw new ProjectContextGenerationError("contextBoundaryViolation", "Symbolic links are not accepted in ShipGlows context.");
        }
        if (entry.isDirectory()) walk(candidate);
        else if (entry.isFile() && ARTIFACT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
          add(candidate, relative(root, candidate), "shipglowsArtifact");
        }
      }
    };
    walk(artifactsRoot);
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")) throw error;
  }
  return files;
}

async function sourceCommit(repositoryRoot: string): Promise<string> {
  try {
    const result = await execFileAsync("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: repositoryRoot,
      timeout: 5_000,
      maxBuffer: 16 * 1024,
      windowsHide: true,
    });
    const commit = result.stdout.trim();
    if (!/^[a-f0-9]{40,64}$/i.test(commit)) throw new Error("invalid commit");
    return commit;
  } catch {
    throw new ProjectContextGenerationError("localSourceUnavailable", "The local repository commit could not be resolved.");
  }
}

function sameSources(left: readonly ProjectContextSource[], right: readonly ProjectContextSource[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class LocalProjectContextGenerator {
  readonly #pending = new Map<string, Promise<ProjectContextBundle>>();

  constructor(readonly source: LocalProjectContextSource, readonly store: ContextStore) {}

  refresh(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }): Promise<ProjectContextBundle> {
    const key = `${input.tenantId}:${input.projectId}`;
    const current = this.#pending.get(key);
    if (current !== undefined) return current;
    const operation = this.#refresh(input).finally(() => this.#pending.delete(key));
    this.#pending.set(key, operation);
    return operation;
  }

  async #refresh(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }): Promise<ProjectContextBundle> {
    const repositoryPath = this.source.resolveLocalRepository(input);
    if (repositoryPath === null) {
      throw new ProjectContextGenerationError("localSourceUnavailable", "A readable local repository is required to refresh project context.");
    }
    let root: string;
    try {
      root = realpathSync(repositoryPath);
    } catch {
      throw new ProjectContextGenerationError("localSourceUnavailable", "The local repository is unavailable.");
    }
    const commit = await sourceCommit(root);
    const candidates = collectFiles(root);
    let totalBytes = 0;
    const sources = candidates.map((candidate) => {
      const before = lstatSync(candidate.path);
      const content = readFileSync(candidate.path);
      const after = lstatSync(candidate.path);
      if (before.isSymbolicLink() || after.isSymbolicLink() || before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
        throw new ProjectContextGenerationError("contextBoundaryViolation", "A project context source changed during its bounded read.");
      }
      totalBytes += content.byteLength;
      if (totalBytes > MAX_TOTAL_BYTES) {
        throw new ProjectContextGenerationError("contextLimitExceeded", "The project context exceeds the total size limit.");
      }
      return Object.freeze({
        kind: candidate.kind,
        reference: opaqueReference(candidate.kind, candidate.relativePath),
        sha256: createHash("sha256").update(content).digest("hex"),
      });
    });
    const latest = this.store.getLatestProjectContextBundle({ tenantId: input.tenantId, projectId: input.projectId });
    if (latest?.sourceCommit === commit && sameSources(latest.sources, sources)) return latest;

    this.store.ensureLocalProjectContextTarget(input);
    const createdAt = new Date().toISOString();
    const suffix = randomUUID().replaceAll("-", "");
    const context: ProjectContextBundle = Object.freeze({
      schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
      bundleId: `ctx_${suffix}`,
      tenantId: input.tenantId,
      projectId: input.projectId,
      sourceCommit: commit,
      createdAt,
      sources: Object.freeze(sources),
      redactionCount: 0,
    });
    this.store.persistSkillEvidenceEnvelope({
      context,
      run: Object.freeze({
        schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
        skillRunId: `run_${suffix}`,
        tenantId: input.tenantId,
        projectId: input.projectId,
        skillId: "local-project-context-indexer",
        skillVersion: "1.0.0",
        contextBundleId: context.bundleId,
        startedAt: createdAt,
        completedAt: createdAt,
        outcome: "completed",
      }),
      evidence: Object.freeze([]),
    });
    return context;
  }
}
