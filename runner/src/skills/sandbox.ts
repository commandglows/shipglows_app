import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import {
  PROJECT_CONTEXT_SCHEMA_VERSION,
  SKILL_EVIDENCE_SCHEMA_VERSION,
  type SkillEvidenceEnvelope,
  validateSkillEvidenceEnvelope,
} from "./contracts.js";

interface JustBashExecResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

interface JustBashInstance {
  exec(script: string, options: { readonly replaceEnv: boolean; readonly signal: AbortSignal }): Promise<JustBashExecResult>;
}

interface JustBashModule {
  readonly Bash: new (options: {
    readonly files: Readonly<Record<string, string>>;
    readonly cwd: string;
    readonly commands: readonly string[];
    readonly executionLimits: Readonly<Record<string, number>>;
  }) => JustBashInstance;
}

// just-bash 3.2.0 omits some re-exported declaration files from its npm tarball.
// Keep the workaround local and narrow instead of weakening project-wide type checking.
const require = createRequire(import.meta.url);
const { Bash } = require("just-bash") as JustBashModule;

const MAX_SNAPSHOT_FILES = 64;
const MAX_SNAPSHOT_BYTES = 512 * 1024;
const MAX_RESULT_BYTES = 4096;
const TECH_AUDIT_SCRIPT = `
if grep -R -F "eval(" /workspace >/dev/null 2>&1; then
  printf 'warning\t1\tDynamic eval usage found.\n'
else
  printf 'healthy\t0\tNo dynamic eval usage found.\n'
fi
`;

export interface ControlledProjectSnapshot {
  readonly files: Readonly<Record<string, string>>;
  readonly redactionCount: number;
}

export interface SkillSandboxInput {
  readonly tenantId: string;
  readonly projectId: string;
  readonly sourceCommit: string;
  readonly snapshot: ControlledProjectSnapshot;
}

export class SkillSandboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillSandboxError";
  }
}

export interface SkillSandboxDependencies {
  readonly now?: () => Date;
  readonly createId?: (prefix: "ctx" | "skr" | "evd") => string;
  readonly timeoutMs?: number;
}

export interface SkillEvidenceWriter {
  persistSkillEvidenceEnvelope(envelope: SkillEvidenceEnvelope): void;
}

function defaultId(prefix: "ctx" | "skr" | "evd"): string {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

function validateSnapshot(snapshot: ControlledProjectSnapshot): readonly [string, string][] {
  if (!Number.isSafeInteger(snapshot.redactionCount) || snapshot.redactionCount < 0) {
    throw new SkillSandboxError("Snapshot redaction count is invalid.");
  }
  const files = Object.entries(snapshot.files).sort(([left], [right]) => left.localeCompare(right));
  if (files.length === 0 || files.length > MAX_SNAPSHOT_FILES) {
    throw new SkillSandboxError("Snapshot file count is outside the allowed range.");
  }
  let bytes = 0;
  for (const [path, content] of files) {
    if (!/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]{1,200}$/.test(path)) {
      throw new SkillSandboxError("Snapshot contains an invalid relative path.");
    }
    bytes += Buffer.byteLength(content, "utf8");
    if (bytes > MAX_SNAPSHOT_BYTES) throw new SkillSandboxError("Snapshot exceeds the byte limit.");
  }
  return files;
}

function parseAuditResult(stdout: string): {
  readonly status: "healthy" | "warning";
  readonly issueCount: number;
  readonly text: string;
} {
  if (Buffer.byteLength(stdout, "utf8") > MAX_RESULT_BYTES) {
    throw new SkillSandboxError("Sandbox result exceeds the byte limit.");
  }
  const match = /^(healthy|warning)\t([0-9]+)\t([^\r\n]{1,240})\r?\n?$/.exec(stdout);
  if (match === null) throw new SkillSandboxError("Sandbox returned an invalid result contract.");
  const issueCount = Number(match[2]);
  if (!Number.isSafeInteger(issueCount) || issueCount > 10_000) {
    throw new SkillSandboxError("Sandbox issue count is invalid.");
  }
  const status = match[1];
  const text = match[3];
  if ((status !== "healthy" && status !== "warning") || text === undefined) {
    throw new SkillSandboxError("Sandbox returned an invalid result contract.");
  }
  return { status, issueCount, text };
}

export class JustBashSkillProducer {
  readonly #now: () => Date;
  readonly #createId: (prefix: "ctx" | "skr" | "evd") => string;
  readonly #timeoutMs: number;

  constructor(dependencies: SkillSandboxDependencies = {}) {
    this.#now = dependencies.now ?? (() => new Date());
    this.#createId = dependencies.createId ?? defaultId;
    this.#timeoutMs = dependencies.timeoutMs ?? 1000;
    if (!Number.isSafeInteger(this.#timeoutMs) || this.#timeoutMs < 10 || this.#timeoutMs > 10_000) {
      throw new SkillSandboxError("Sandbox timeout is invalid.");
    }
  }

  async runTechSnapshotAudit(input: SkillSandboxInput): Promise<SkillEvidenceEnvelope> {
    const files = validateSnapshot(input.snapshot);
    const contextBundleId = this.#createId("ctx");
    const skillRunId = this.#createId("skr");
    const evidenceId = this.#createId("evd");
    const createdAt = this.#now().toISOString();
    const startedAt = this.#now().toISOString();
    const bash = new Bash({
      files: Object.fromEntries(files.map(([path, content]) => [`/workspace/${path}`, content])),
      cwd: "/workspace",
      commands: ["grep", "printf"],
      executionLimits: {
        maxCommandCount: 20,
        maxLoopIterations: 20,
        maxCallDepth: 10,
        maxStringLength: MAX_RESULT_BYTES,
      },
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    let result: JustBashExecResult;
    try {
      result = await bash.exec(TECH_AUDIT_SCRIPT, { replaceEnv: true, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw new SkillSandboxError("Sandbox audit failed with a bounded execution error.");
    }
    const audit = parseAuditResult(result.stdout);
    const completedAt = this.#now().toISOString();
    const envelope: SkillEvidenceEnvelope = {
      context: {
        schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
        bundleId: contextBundleId,
        tenantId: input.tenantId,
        projectId: input.projectId,
        sourceCommit: input.sourceCommit,
        createdAt,
        sources: files.map(([path, content]) => ({
          kind: "repositorySnapshot",
          reference: `snapshot:${path}`,
          sha256: createHash("sha256").update(content, "utf8").digest("hex"),
        })),
        redactionCount: input.snapshot.redactionCount,
      },
      run: {
        schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
        skillRunId,
        tenantId: input.tenantId,
        projectId: input.projectId,
        skillId: "shipglows.tech.snapshot",
        skillVersion: "1.0.0",
        contextBundleId,
        startedAt,
        completedAt,
        outcome: "completed",
      },
      evidence: [{
        schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
        evidenceId,
        skillRunId,
        contextBundleId,
        dimension: "tech",
        status: audit.status,
        summary: { text: audit.text, issueCount: audit.issueCount },
        sourceCommit: input.sourceCommit,
        observedAt: completedAt,
      }],
    };
    validateSkillEvidenceEnvelope(envelope);
    return envelope;
  }
}

export class SkillHealthService {
  constructor(
    readonly producer: JustBashSkillProducer,
    readonly writer: SkillEvidenceWriter,
  ) {}

  async runTechSnapshotAudit(input: SkillSandboxInput): Promise<SkillEvidenceEnvelope> {
    const envelope = await this.producer.runTechSnapshotAudit(input);
    this.writer.persistSkillEvidenceEnvelope(envelope);
    return envelope;
  }
}
