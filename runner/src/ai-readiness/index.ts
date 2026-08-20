import { constants } from "node:fs";
import { lstat, open, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

export const AI_READINESS_VERSION = "shipglows.ai-readiness.v1" as const;
export const AI_READINESS_CHECKS = [
  "structure",
  "schemas",
  "agentGuidance",
  "llmsText",
  "sitemap",
  "fastFeedback",
] as const;

export type AiReadinessCheckId = (typeof AI_READINESS_CHECKS)[number];
export type AiReadinessCheckOutcome = "passed" | "warning" | "missing" | "notApplicable";
export type AiReadinessStatus = "ready" | "needsWork" | "partial" | "unavailable";

export interface AiReadinessCheck {
  readonly id: AiReadinessCheckId;
  readonly outcome: AiReadinessCheckOutcome;
  readonly earnedPoints: number;
  readonly maxPoints: number;
  readonly summary: string;
}

export interface ProjectAiReadinessProjection {
  readonly version: typeof AI_READINESS_VERSION;
  readonly status: AiReadinessStatus;
  readonly score: number | null;
  readonly coverage: number;
  readonly evaluatedAt: string;
  readonly checks: readonly AiReadinessCheck[];
  readonly recommendations: readonly string[];
}

export interface ProjectAiReadinessEvaluator {
  evaluate(repositoryRoot: string): Promise<ProjectAiReadinessProjection>;
}

interface ScanResult {
  readonly files: ReadonlySet<string>;
  readonly directories: ReadonlySet<string>;
  readonly truncated: boolean;
}

interface EvaluatorOptions {
  readonly maxEntries?: number;
  readonly maxDepth?: number;
  readonly maxMetadataBytes?: number;
  readonly now?: () => Date;
}

const WEIGHTS: Readonly<Record<AiReadinessCheckId, number>> = Object.freeze({
  structure: 20,
  schemas: 15,
  agentGuidance: 20,
  llmsText: 15,
  sitemap: 10,
  fastFeedback: 20,
});

const IGNORED_DIRECTORIES = new Set([
  ".dart_tool",
  ".git",
  ".next",
  ".shipglows-workspaces",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
]);

const MANIFEST_NAMES = new Set(["cargo.toml", "go.mod", "package.json", "pubspec.yaml", "pyproject.toml"]);
const LOCKFILE_NAMES = new Set(["cargo.lock", "package-lock.json", "pnpm-lock.yaml", "pubspec.lock", "uv.lock", "yarn.lock"]);
const SOURCE_DIRECTORIES = new Set(["app", "apps", "lib", "packages", "src"]);

export class BoundedProjectAiReadinessEvaluator implements ProjectAiReadinessEvaluator {
  readonly #maxEntries: number;
  readonly #maxDepth: number;
  readonly #maxMetadataBytes: number;
  readonly #now: () => Date;

  constructor(options: EvaluatorOptions = {}) {
    this.#maxEntries = options.maxEntries ?? 5_000;
    this.#maxDepth = options.maxDepth ?? 4;
    this.#maxMetadataBytes = options.maxMetadataBytes ?? 262_144;
    this.#now = options.now ?? (() => new Date());
    if (!Number.isSafeInteger(this.#maxEntries) || this.#maxEntries < 1 ||
        !Number.isSafeInteger(this.#maxDepth) || this.#maxDepth < 0 || this.#maxDepth > 16 ||
        !Number.isSafeInteger(this.#maxMetadataBytes) || this.#maxMetadataBytes < 1) {
      throw new Error("AI readiness evaluator budgets are invalid.");
    }
  }

  async evaluate(repositoryRoot: string): Promise<ProjectAiReadinessProjection> {
    const evaluatedAt = this.#now().toISOString();
    const root = resolve(repositoryRoot);
    try {
      const rootStat = await lstat(root);
      if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) return unavailableAiReadinessProjection(evaluatedAt);
      const scan = await this.#scan(root);
      const packageJsonFiles = await this.#readPackageJsonFiles(root, scan.files);
      const checks = buildChecks(scan, packageJsonFiles);
      if (scan.truncated) {
        return {
          version: AI_READINESS_VERSION,
          status: "partial",
          score: null,
          coverage: conclusiveCoverage(checks),
          evaluatedAt,
          checks,
          recommendations: [
            "Reduce generated or vendored repository noise so ShipGlows can complete a bounded readiness scan.",
            ...recommendations(checks),
          ].slice(0, 3),
        };
      }
      const applicable = checks.filter((check) => check.outcome !== "notApplicable");
      const earned = applicable.reduce((total, check) => total + check.earnedPoints, 0);
      const maximum = applicable.reduce((total, check) => total + check.maxPoints, 0);
      const score = maximum === 0 ? 0 : Math.round((earned / maximum) * 100);
      return {
        version: AI_READINESS_VERSION,
        status: score >= 80 ? "ready" : "needsWork",
        score,
        coverage: 1,
        evaluatedAt,
        checks,
        recommendations: recommendations(checks),
      };
    } catch {
      return unavailableAiReadinessProjection(evaluatedAt);
    }
  }

  async #scan(root: string): Promise<ScanResult> {
    const files = new Set<string>();
    const directories = new Set<string>();
    let entriesSeen = 0;
    let truncated = false;

    const visit = async (directory: string, depth: number): Promise<void> => {
      if (truncated) return;
      const entries = await readdir(directory, { withFileTypes: true });
      entries.sort((left, right) => left.name.localeCompare(right.name));
      for (const entry of entries) {
        entriesSeen += 1;
        if (entriesSeen > this.#maxEntries) {
          truncated = true;
          return;
        }
        if (entry.isSymbolicLink()) continue;
        const absolute = join(directory, entry.name);
        const normalized = normalizeRelative(root, absolute);
        if (entry.isFile()) {
          files.add(normalized);
        } else if (entry.isDirectory()) {
          directories.add(normalized);
          if (depth < this.#maxDepth && !IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) {
            await visit(absolute, depth + 1);
          }
        }
      }
    };

    await visit(root, 0);
    return { files, directories, truncated };
  }

  async #readPackageJsonFiles(root: string, files: ReadonlySet<string>): Promise<readonly Record<string, unknown>[]> {
    const manifests = [...files].filter((path) => path === "package.json" || path.endsWith("/package.json")).slice(0, 16);
    const parsedFiles: Record<string, unknown>[] = [];
    for (const manifest of manifests) {
      const path = join(root, ...manifest.split("/"));
      let handle: Awaited<ReturnType<typeof open>> | undefined;
      try {
        handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size > this.#maxMetadataBytes) continue;
        const parsed: unknown = JSON.parse(await handle.readFile("utf8"));
        if (isRecord(parsed)) parsedFiles.push(parsed);
      } catch {
        // Malformed manifests are untrusted missing evidence, not fatal errors.
      } finally {
        await handle?.close();
      }
    }
    return parsedFiles;
  }
}

function buildChecks(scan: ScanResult, packageJsonFiles: readonly Record<string, unknown>[]): readonly AiReadinessCheck[] {
  const rootFiles = new Set([...scan.files].filter((path) => !path.includes("/")));
  const rootDirectories = new Set([...scan.directories].filter((path) => !path.includes("/")));
  const hasManifest = [...scan.files].some((path) => MANIFEST_NAMES.has(path.split("/").at(-1) ?? ""));
  const hasSourceDirectory = [...rootDirectories].some((path) => SOURCE_DIRECTORIES.has(path));
  const structurePoints = (hasManifest ? 10 : 0) + (hasSourceDirectory ? 10 : 0);

  const hasSchema = [...scan.files].some((path) =>
    /(^|\/)(openapi\.(json|ya?ml)|[^/]+\.schema\.json|[^/]+\.(graphql|proto))$/.test(path) ||
    /(^|\/)(schemas?|contracts?)\//.test(path));
  const hasGuidance = [...scan.files].some((path) =>
    /(^|\/)(agents|claude|shipglows)\.md$/.test(path) || path.endsWith("/.github/copilot-instructions.md") || path === ".github/copilot-instructions.md");
  const hasLlmsText = [...scan.files].some((path) => path === "llms.txt" || /(^|\/)public\/llms\.txt$/.test(path));

  const packageDependencies = dependencyNames(packageJsonFiles);
  const webProject = [...scan.files].some((path) => /(^|\/)(astro|next|vite)\.config\.[^/]+$/.test(path)) ||
    scan.directories.has("web") || scan.directories.has("site") || scan.directories.has("public") ||
    ["astro", "next", "vite", "@angular/core"].some((name) => packageDependencies.has(name));
  const hasSitemap = [...scan.files].some((path) => /(^|\/)(sitemap(-index)?\.xml|sitemap\.config\.(c?js|mjs|ts))$/.test(path)) ||
    packageDependencies.has("@astrojs/sitemap") || packageDependencies.has("next-sitemap");

  const hasLockfile = [...scan.files].some((path) => LOCKFILE_NAMES.has(path.split("/").at(-1) ?? ""));
  const hasFastCheck = packageJsonFiles.some((manifest) => {
    const scripts = manifest["scripts"];
    return isRecord(scripts) && Object.keys(scripts).some((name) => ["test", "lint", "check", "typecheck"].includes(name));
  }) ||
    rootFiles.has("makefile") || rootFiles.has("justfile") || scan.directories.has("test") || scan.directories.has("tests");
  const feedbackPoints = (hasLockfile ? 10 : 0) + (hasFastCheck ? 10 : 0);

  return Object.freeze([
    scoredCheck("structure", structurePoints, structurePoints === 20 ? "Manifest and source structure are discoverable." : "Add a root manifest and a conventional source directory."),
    scoredCheck("schemas", hasSchema ? 15 : 0, hasSchema ? "Machine-readable schemas or contracts are discoverable." : "Add machine-readable schemas or explicit interface contracts."),
    scoredCheck("agentGuidance", hasGuidance ? 20 : 0, hasGuidance ? "Project-level agent guidance is present." : "Add project-level AGENTS.md or equivalent agent guidance."),
    scoredCheck("llmsText", hasLlmsText ? 15 : 0, hasLlmsText ? "llms.txt is discoverable." : "Add llms.txt to expose the project map to AI tools."),
    webProject
      ? scoredCheck("sitemap", hasSitemap ? 10 : 0, hasSitemap ? "A web sitemap contract is discoverable." : "Add a generated sitemap for the web surface.")
      : { id: "sitemap", outcome: "notApplicable", earnedPoints: 0, maxPoints: 10, summary: "Sitemap is not applicable to this non-web project." },
    scoredCheck("fastFeedback", feedbackPoints, feedbackPoints === 20 ? "Lockfile and fast validation entry points are present." : "Add a lockfile and standard test, lint, check, or typecheck entry points."),
  ]);
}

function scoredCheck(id: AiReadinessCheckId, earnedPoints: number, summary: string): AiReadinessCheck {
  const maxPoints = WEIGHTS[id];
  return {
    id,
    outcome: earnedPoints === maxPoints ? "passed" : earnedPoints > 0 ? "warning" : "missing",
    earnedPoints,
    maxPoints,
    summary,
  };
}

function dependencyNames(packageJsonFiles: readonly Record<string, unknown>[]): ReadonlySet<string> {
  const names = new Set<string>();
  for (const packageJson of packageJsonFiles) {
    for (const key of ["dependencies", "devDependencies"]) {
      const dependencies = packageJson[key];
      if (isRecord(dependencies)) for (const name of Object.keys(dependencies)) names.add(name);
    }
  }
  return names;
}

function recommendations(checks: readonly AiReadinessCheck[]): readonly string[] {
  return checks
    .filter((check) => check.outcome === "missing" || check.outcome === "warning")
    .sort((left, right) => right.maxPoints - right.earnedPoints - (left.maxPoints - left.earnedPoints))
    .map((check) => check.summary)
    .slice(0, 3);
}

function conclusiveCoverage(checks: readonly AiReadinessCheck[]): number {
  const applicable = checks.filter((check) => check.outcome !== "notApplicable");
  if (applicable.length === 0) return 0;
  const conclusive = applicable.filter((check) => check.outcome === "passed").length;
  return conclusive / applicable.length;
}

export function unavailableAiReadinessProjection(evaluatedAt = new Date().toISOString()): ProjectAiReadinessProjection {
  return {
    version: AI_READINESS_VERSION,
    status: "unavailable",
    score: null,
    coverage: 0,
    evaluatedAt,
    checks: [],
    recommendations: ["Restore safe repository access before evaluating AI readiness."],
  };
}

function normalizeRelative(root: string, target: string): string {
  return relative(root, target).split(sep).map((part) => part.toLowerCase()).join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
