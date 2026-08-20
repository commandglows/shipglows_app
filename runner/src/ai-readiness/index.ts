import { constants, type Dirent } from "node:fs";
import { lstat, open, opendir, realpath } from "node:fs/promises";
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
  readonly files: ReadonlyMap<string, string>;
  readonly directories: ReadonlySet<string>;
  readonly truncated: boolean;
}

interface PackageJsonScan {
  readonly manifests: readonly Record<string, unknown>[];
  readonly truncated: boolean;
}

interface EvaluatorOptions {
  readonly maxEntries?: number;
  readonly maxDepth?: number;
  readonly maxMetadataBytes?: number;
  readonly maxPackageManifests?: number;
  readonly maxConcurrentScans?: number;
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
const LOCKFILE_NAMES = new Set([
  "bun.lock",
  "bun.lockb",
  "cargo.lock",
  "go.sum",
  "package-lock.json",
  "pnpm-lock.yaml",
  "poetry.lock",
  "pubspec.lock",
  "uv.lock",
  "yarn.lock",
]);
const SOURCE_DIRECTORIES = new Set(["app", "apps", "lib", "packages", "src"]);
const READY_SCORE = 80;
const REQUIRED_READY_CHECKS = new Set<AiReadinessCheckId>(["structure", "agentGuidance", "fastFeedback"]);

export class BoundedProjectAiReadinessEvaluator implements ProjectAiReadinessEvaluator {
  readonly #maxEntries: number;
  readonly #maxDepth: number;
  readonly #maxMetadataBytes: number;
  readonly #maxPackageManifests: number;
  readonly #maxConcurrentScans: number;
  readonly #now: () => Date;
  readonly #inFlight = new Map<string, Promise<ProjectAiReadinessProjection>>();
  readonly #scanWaiters: (() => void)[] = [];
  #activeScans = 0;

  constructor(options: EvaluatorOptions = {}) {
    this.#maxEntries = options.maxEntries ?? 5_000;
    this.#maxDepth = options.maxDepth ?? 4;
    this.#maxMetadataBytes = options.maxMetadataBytes ?? 262_144;
    this.#maxPackageManifests = options.maxPackageManifests ?? 16;
    this.#maxConcurrentScans = options.maxConcurrentScans ?? 4;
    this.#now = options.now ?? (() => new Date());
    if (!Number.isSafeInteger(this.#maxEntries) || this.#maxEntries < 1 ||
        !Number.isSafeInteger(this.#maxDepth) || this.#maxDepth < 0 || this.#maxDepth > 16 ||
        !Number.isSafeInteger(this.#maxMetadataBytes) || this.#maxMetadataBytes < 1 ||
        !Number.isSafeInteger(this.#maxPackageManifests) || this.#maxPackageManifests < 1 ||
        !Number.isSafeInteger(this.#maxConcurrentScans) || this.#maxConcurrentScans < 1) {
      throw new Error("AI readiness evaluator budgets are invalid.");
    }
  }

  async evaluate(repositoryRoot: string): Promise<ProjectAiReadinessProjection> {
    const requestedRoot = resolve(repositoryRoot);
    const existing = this.#inFlight.get(requestedRoot);
    if (existing !== undefined) return existing;
    const pending = this.#withScanPermit(() => this.#evaluateOnce(requestedRoot));
    this.#inFlight.set(requestedRoot, pending);
    try {
      return await pending;
    } finally {
      if (this.#inFlight.get(requestedRoot) === pending) this.#inFlight.delete(requestedRoot);
    }
  }

  async #evaluateOnce(requestedRoot: string): Promise<ProjectAiReadinessProjection> {
    let evaluatedAt = new Date(0).toISOString();
    try {
      evaluatedAt = this.#now().toISOString();
      const root = await realpath(requestedRoot);
      if (root !== requestedRoot) return unavailableAiReadinessProjection(evaluatedAt);
      const rootStat = await lstat(root);
      if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) return unavailableAiReadinessProjection(evaluatedAt);
      const scan = await this.#scan(root);
      const packageJson = await this.#readPackageJsonFiles(root, scan.files);
      const checks = buildChecks(scan, packageJson.manifests);
      if (scan.truncated) {
        return partialProjection(
          evaluatedAt,
          checks.filter((check) => check.outcome === "passed"),
          "Reduce generated or vendored repository noise so ShipGlows can complete a bounded readiness scan.",
        );
      }
      if (packageJson.truncated) {
        const conclusiveChecks = checks.filter((check) => check.id !== "sitemap" && check.id !== "fastFeedback");
        return partialProjection(
          evaluatedAt,
          conclusiveChecks,
          "Reduce or consolidate package manifests so ShipGlows can inspect every validation entry point.",
        );
      }
      const applicable = checks.filter((check) => check.outcome !== "notApplicable");
      const earned = applicable.reduce((total, check) => total + check.earnedPoints, 0);
      const maximum = applicable.reduce((total, check) => total + check.maxPoints, 0);
      const score = maximum === 0 ? 0 : Math.round((earned / maximum) * 100);
      const requiredChecksPassed = checks
        .filter((check) => REQUIRED_READY_CHECKS.has(check.id))
        .every((check) => check.outcome === "passed");
      return {
        version: AI_READINESS_VERSION,
        status: score >= READY_SCORE && requiredChecksPassed ? "ready" : "needsWork",
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

  async #withScanPermit<T>(action: () => Promise<T>): Promise<T> {
    if (this.#activeScans >= this.#maxConcurrentScans) {
      await new Promise<void>((resolveWaiter) => this.#scanWaiters.push(resolveWaiter));
    } else {
      this.#activeScans += 1;
    }
    try {
      return await action();
    } finally {
      const next = this.#scanWaiters.shift();
      if (next === undefined) this.#activeScans -= 1;
      else next();
    }
  }

  async #scan(root: string): Promise<ScanResult> {
    const files = new Map<string, string>();
    const directories = new Set<string>();
    let entriesSeen = 0;
    let truncated = false;

    const visit = async (directory: string, depth: number): Promise<void> => {
      if (truncated) return;
      const before = await lstat(directory);
      if (!before.isDirectory() || before.isSymbolicLink() || await realpath(directory) !== directory) {
        throw new Error("Repository directory boundary changed.");
      }
      const entries: Dirent[] = [];
      const dir = await opendir(directory);
      for await (const entry of dir) {
        entriesSeen += 1;
        if (entriesSeen > this.#maxEntries) {
          truncated = true;
          break;
        }
        entries.push(entry);
      }
      entries.sort((left, right) => binaryCompare(left.name, right.name));
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const absolute = join(directory, entry.name);
        const normalized = normalizeRelative(root, absolute);
        if (entry.isFile()) {
          files.set(normalized, relative(root, absolute));
        } else if (entry.isDirectory()) {
          directories.add(normalized);
          if (depth < this.#maxDepth && !IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) {
            await visit(absolute, depth + 1);
          }
        }
      }
      const after = await lstat(directory);
      if (!after.isDirectory() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino ||
          await realpath(directory) !== directory) {
        throw new Error("Repository directory boundary changed.");
      }
    };

    await visit(root, 0);
    return { files, directories, truncated };
  }

  async #readPackageJsonFiles(root: string, files: ReadonlyMap<string, string>): Promise<PackageJsonScan> {
    const candidates = [...files.entries()]
      .filter(([normalized]) => normalized === "package.json" || normalized.endsWith("/package.json"))
      .sort(([leftKey, leftPath], [rightKey, rightPath]) => binaryCompare(leftKey, rightKey) || binaryCompare(leftPath, rightPath));
    const manifests = candidates.slice(0, this.#maxPackageManifests);
    const parsedFiles: Record<string, unknown>[] = [];
    for (const [, manifest] of manifests) {
      const path = join(root, ...manifest.split(sep));
      let handle: Awaited<ReturnType<typeof open>> | undefined;
      try {
        if (await realpath(path) !== path) continue;
        handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
        const before = await handle.stat();
        if (!before.isFile() || before.size > this.#maxMetadataBytes) continue;
        const buffer = Buffer.alloc(this.#maxMetadataBytes + 1);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        if (bytesRead > this.#maxMetadataBytes) continue;
        const after = await handle.stat();
        if (!after.isFile() || before.dev !== after.dev || before.ino !== after.ino ||
            before.mtimeMs !== after.mtimeMs || before.size !== after.size || await realpath(path) !== path) continue;
        const parsed: unknown = JSON.parse(buffer.toString("utf8", 0, bytesRead));
        if (isRecord(parsed)) parsedFiles.push(parsed);
      } catch {
        // Malformed manifests are untrusted missing evidence, not fatal errors.
      } finally {
        try {
          await handle?.close();
        } catch {
          // A close failure cannot make untrusted repository evidence valid.
        }
      }
    }
    return { manifests: parsedFiles, truncated: candidates.length > this.#maxPackageManifests };
  }
}

function buildChecks(scan: ScanResult, packageJsonFiles: readonly Record<string, unknown>[]): readonly AiReadinessCheck[] {
  const fileNames = [...scan.files.keys()];
  const rootFiles = new Set(fileNames.filter((path) => !path.includes("/")));
  const rootDirectories = new Set([...scan.directories].filter((path) => !path.includes("/")));
  const hasManifest = [...rootFiles].some((path) => MANIFEST_NAMES.has(path));
  const hasSourceDirectory = [...rootDirectories].some((path) => SOURCE_DIRECTORIES.has(path));
  const structurePoints = (hasManifest ? 10 : 0) + (hasSourceDirectory ? 10 : 0);

  const hasSchema = fileNames.some((path) =>
    /(^|\/)(openapi\.(json|ya?ml)|[^/]+\.schema\.json|[^/]+\.(graphql|proto))$/.test(path) ||
    /(^|\/)(schemas?|contracts?)\/[^/]+\.(json|ya?ml|graphql|proto)$/.test(path));
  const hasGuidance = fileNames.some((path) =>
    /(^|\/)(agents|claude|shipglows)\.md$/.test(path) || path.endsWith("/.github/copilot-instructions.md") || path === ".github/copilot-instructions.md");
  const hasLlmsText = fileNames.some((path) => path === "llms.txt" || /(^|\/)public\/llms\.txt$/.test(path));

  const packageDependencies = dependencyNames(packageJsonFiles);
  const webProject = fileNames.some((path) => /(^|\/)(astro|next|vite)\.config\.[^/]+$/.test(path)) ||
    scan.directories.has("web") || scan.directories.has("site") || scan.directories.has("public") ||
    ["astro", "next", "vite", "@angular/core"].some((name) => packageDependencies.has(name));
  const hasSitemap = fileNames.some((path) => /(^|\/)(sitemap(-index)?\.xml|sitemap\.config\.(c?js|mjs|ts))$/.test(path)) ||
    packageDependencies.has("@astrojs/sitemap") || packageDependencies.has("next-sitemap");

  const hasLockfile = fileNames.some((path) => LOCKFILE_NAMES.has(path.split("/").at(-1) ?? ""));
  const hasFastCheck = packageJsonFiles.some((manifest) => {
    const scripts = manifest["scripts"];
    return isRecord(scripts) && Object.keys(scripts).some((name) => ["test", "lint", "check", "typecheck"].includes(name));
  }) ||
    rootFiles.has("cargo.toml") || rootFiles.has("go.mod") ||
    (rootFiles.has("pubspec.yaml") && scan.directories.has("test")) ||
    (rootFiles.has("pyproject.toml") && (scan.directories.has("test") || scan.directories.has("tests")));
  const feedbackPoints = (hasLockfile ? 10 : 0) + (hasFastCheck ? 10 : 0);
  const structureSummary = structurePoints === 20
    ? "Manifest and source structure are discoverable."
    : !hasManifest && !hasSourceDirectory
      ? "Add a root manifest and a conventional source directory."
      : !hasManifest
        ? "Add a root project manifest."
        : "Add a conventional source directory.";
  const feedbackSummary = feedbackPoints === 20
    ? "Lockfile and fast validation entry points are present."
    : !hasLockfile && !hasFastCheck
      ? "Add a lockfile and standard test, lint, check, or typecheck entry points."
      : !hasLockfile
        ? "Add a lockfile for reproducible fast feedback."
        : "Add standard test, lint, check, or typecheck entry points.";

  return Object.freeze([
    scoredCheck("structure", structurePoints, structureSummary),
    scoredCheck("schemas", hasSchema ? 15 : 0, hasSchema ? "Machine-readable schemas or contracts are discoverable." : "Add machine-readable schemas or explicit interface contracts."),
    scoredCheck("agentGuidance", hasGuidance ? 20 : 0, hasGuidance ? "Project-level agent guidance is present." : "Add project-level AGENTS.md or equivalent agent guidance."),
    scoredCheck("llmsText", hasLlmsText ? 15 : 0, hasLlmsText ? "llms.txt is discoverable." : "Add llms.txt to expose the project map to AI tools."),
    webProject
      ? scoredCheck("sitemap", hasSitemap ? 10 : 0, hasSitemap ? "A web sitemap contract is discoverable." : "Add a generated sitemap for the web surface.")
      : { id: "sitemap", outcome: "notApplicable", earnedPoints: 0, maxPoints: 10, summary: "Sitemap is not applicable to this non-web project." },
    scoredCheck("fastFeedback", feedbackPoints, feedbackSummary),
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

function partialProjection(
  evaluatedAt: string,
  checks: readonly AiReadinessCheck[],
  boundaryRecommendation: string,
): ProjectAiReadinessProjection {
  return {
    version: AI_READINESS_VERSION,
    status: "partial",
    score: null,
    coverage: checks.length / AI_READINESS_CHECKS.length,
    evaluatedAt,
    checks,
    recommendations: [boundaryRecommendation, ...recommendations(checks)].slice(0, 3),
  };
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

export function isValidAiReadinessProjection(value: unknown): value is ProjectAiReadinessProjection {
  if (!isRecord(value) || !hasOnlyKeys(value, ["version", "status", "score", "coverage", "evaluatedAt", "checks", "recommendations"])) return false;
  if (value["version"] !== AI_READINESS_VERSION || !isAiReadinessStatus(value["status"]) ||
      typeof value["coverage"] !== "number" || !Number.isFinite(value["coverage"]) || value["coverage"] < 0 || value["coverage"] > 1 ||
      typeof value["evaluatedAt"] !== "string" || !Number.isFinite(Date.parse(value["evaluatedAt"])) ||
      !Array.isArray(value["checks"]) || value["checks"].length > AI_READINESS_CHECKS.length ||
      !Array.isArray(value["recommendations"]) || value["recommendations"].length > 3 ||
      !value["recommendations"].every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 256)) return false;

  const rawChecks: unknown[] = value["checks"];
  const checks: AiReadinessCheck[] = [];
  const ids = new Set<AiReadinessCheckId>();
  let previousCheckIndex = -1;
  for (const rawCheck of rawChecks) {
    if (!isRecord(rawCheck) || !hasOnlyKeys(rawCheck, ["id", "outcome", "earnedPoints", "maxPoints", "summary"])) return false;
    const id = rawCheck["id"];
    const outcome = rawCheck["outcome"];
    const earnedPoints = rawCheck["earnedPoints"];
    const maxPoints = rawCheck["maxPoints"];
    const summary = rawCheck["summary"];
    if (!isAiReadinessCheckId(id) || !isAiReadinessCheckOutcome(outcome) || ids.has(id) ||
        typeof earnedPoints !== "number" || !Number.isSafeInteger(earnedPoints) ||
        typeof maxPoints !== "number" || !Number.isSafeInteger(maxPoints) || maxPoints !== WEIGHTS[id] ||
        typeof summary !== "string" || summary.trim().length === 0 || summary.length > 256 ||
        !outcomeMatchesPoints(outcome, earnedPoints, maxPoints, id)) return false;
    const checkIndex = AI_READINESS_CHECKS.indexOf(id);
    if (checkIndex <= previousCheckIndex) return false;
    previousCheckIndex = checkIndex;
    ids.add(id);
    checks.push({ id, outcome, earnedPoints, maxPoints, summary });
  }

  const status = value["status"];
  const score = value["score"];
  if (status === "unavailable") return score === null && value["coverage"] === 0 && checks.length === 0;
  if (status === "partial") {
    return score === null && checks.length < AI_READINESS_CHECKS.length &&
      Math.abs(value["coverage"] - checks.length / AI_READINESS_CHECKS.length) < 0.0001;
  }
  if (typeof score !== "number" || !Number.isSafeInteger(score) || score < 0 || score > 100 || value["coverage"] !== 1 ||
      checks.length !== AI_READINESS_CHECKS.length || !AI_READINESS_CHECKS.every((id) => ids.has(id))) return false;
  const applicable = checks.filter((check) => check.outcome !== "notApplicable");
  const earned = applicable.reduce((total, check) => total + check.earnedPoints, 0);
  const maximum = applicable.reduce((total, check) => total + check.maxPoints, 0);
  const expectedScore = Math.round((earned / maximum) * 100);
  const requiredPassed = checks
    .filter((check) => REQUIRED_READY_CHECKS.has(check.id))
    .every((check) => check.outcome === "passed");
  const expectedStatus: AiReadinessStatus = expectedScore >= READY_SCORE && requiredPassed ? "ready" : "needsWork";
  return score === expectedScore && status === expectedStatus;
}

function normalizeRelative(root: string, target: string): string {
  return relative(root, target).split(sep).map((part) => part.toLowerCase()).join("/");
}

function binaryCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key)) && keys.every((key) => Object.hasOwn(value, key));
}

function isAiReadinessCheckId(value: unknown): value is AiReadinessCheckId {
  return typeof value === "string" && (AI_READINESS_CHECKS as readonly string[]).includes(value);
}

function isAiReadinessCheckOutcome(value: unknown): value is AiReadinessCheckOutcome {
  return value === "passed" || value === "warning" || value === "missing" || value === "notApplicable";
}

function isAiReadinessStatus(value: unknown): value is AiReadinessStatus {
  return value === "ready" || value === "needsWork" || value === "partial" || value === "unavailable";
}

function outcomeMatchesPoints(
  outcome: AiReadinessCheckOutcome,
  earnedPoints: number,
  maxPoints: number,
  id: AiReadinessCheckId,
): boolean {
  if (earnedPoints < 0 || earnedPoints > maxPoints) return false;
  if (outcome === "passed") return earnedPoints === maxPoints;
  if (outcome === "missing") return earnedPoints === 0;
  if (outcome === "warning") return earnedPoints > 0 && earnedPoints < maxPoints;
  return id === "sitemap" && earnedPoints === 0;
}
