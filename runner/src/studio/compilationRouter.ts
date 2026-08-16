import { createHash } from "node:crypto";

import {
  COMPILATION_ROUTING_CONTRACT_VERSION,
  COMPILATION_TARGETS,
  projectCapabilityEvidenceDigest,
  type CompilationTarget,
  type ProjectCapabilityDetection,
} from "./projectTargetDetector.js";

export const EXECUTION_CLASSES = Object.freeze(["linuxSandbox", "windowsVm", "macosXcode"] as const);
export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];
export const COMPILATION_TOOLCHAINS = Object.freeze(["astroNodePnpm", "flutterWeb", "flutterAndroidGradle", "flutterWindowsMsvc", "flutterIosXcode"] as const);
export type CompilationToolchain = (typeof COMPILATION_TOOLCHAINS)[number];
export const COMPILATION_WORKER_CAPABILITIES = Object.freeze(["hostExecutionDenied", "freshIsolation", "immutableToolchain", "boundedResources", "boundedOutput", "idempotentCleanup"] as const);
export type CompilationWorkerCapability = (typeof COMPILATION_WORKER_CAPABILITIES)[number];

export interface CompilationWorkerEvidence {
  readonly contractVersion: typeof COMPILATION_ROUTING_CONTRACT_VERSION;
  readonly tenantId: string;
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly projectEvidenceDigest: string;
  readonly target: CompilationTarget;
  readonly routeRequirementDigest: string;
  readonly workerId: string;
  readonly resourceIdentityDigest: string;
  readonly executionClass: ExecutionClass;
  readonly toolchain: CompilationToolchain;
  readonly toolchainVersion: string;
  readonly runtimeIdentityDigest: string;
  readonly policyDigest: string;
  readonly capabilities: readonly CompilationWorkerCapability[];
  readonly authorityDigest: string;
  readonly evidenceDigest: string;
  readonly observedAt: string;
  readonly expiresAt: string;
}

export type CompilationWorkerEvidenceClaims = Omit<CompilationWorkerEvidence, "evidenceDigest">;

export interface CompilationWorkerEvidenceVerifier {
  verify(input: { readonly evidence: CompilationWorkerEvidence; readonly requirement: CompilationRouteRequirement }): boolean;
}

export interface CompilationRouteRequirement {
  readonly contractVersion: typeof COMPILATION_ROUTING_CONTRACT_VERSION;
  readonly tenantId: string;
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly projectEvidenceDigest: string;
  readonly target: CompilationTarget;
  readonly executionClass: ExecutionClass;
  readonly toolchain: CompilationToolchain;
  readonly requiredCapabilities: readonly CompilationWorkerCapability[];
  readonly requirementDigest: string;
}

export function compilationRouteRequirementDigest(value: { readonly tenantId: string; readonly project: ProjectCapabilityDetection; readonly target: CompilationTarget; readonly executionClass: ExecutionClass; readonly toolchain: CompilationToolchain }): string {
  return sha256(JSON.stringify([
    COMPILATION_ROUTING_CONTRACT_VERSION, value.tenantId, value.project.projectId, value.project.sourceRevision,
    value.project.repositoryDigest, value.project.evidenceDigest, value.target, value.executionClass, value.toolchain,
    COMPILATION_WORKER_CAPABILITIES,
  ]));
}

/** Canonical digest for claims already accepted by an independent evidence authority. */
export function compilationWorkerEvidenceDigest(value: CompilationWorkerEvidenceClaims): string {
  return sha256(JSON.stringify([
    value.contractVersion, value.tenantId, value.projectId, value.sourceRevision, value.repositoryDigest,
    value.projectEvidenceDigest, value.target, value.routeRequirementDigest, value.workerId, value.resourceIdentityDigest,
    value.executionClass, value.toolchain, value.toolchainVersion, value.runtimeIdentityDigest, value.policyDigest, value.capabilities, value.authorityDigest,
    value.observedAt, value.expiresAt,
  ]));
}

export type CompilationRoute = {
  readonly supported: true;
  readonly contractVersion: typeof COMPILATION_ROUTING_CONTRACT_VERSION;
  readonly target: CompilationTarget;
  readonly executionClass: ExecutionClass;
  readonly toolchain: CompilationToolchain;
  readonly requiredCapabilities: readonly CompilationWorkerCapability[];
  readonly projectEvidenceDigest: string;
  readonly workerEvidenceDigest: string;
  readonly routeDigest: string;
  readonly expiresAt: string;
} | {
  readonly supported: false;
  readonly contractVersion: typeof COMPILATION_ROUTING_CONTRACT_VERSION;
  readonly target: CompilationTarget | null;
  readonly reason: "unknownTarget" | "invalidProjectEvidence" | "targetNotDeclared" | "workerUnconfigured" | "workerUnproved" | "toolchainUnproved" | "incompatibleWorker";
};

const routeTable: Readonly<Record<CompilationTarget, { readonly executionClass: ExecutionClass; readonly toolchain: CompilationToolchain }>> = Object.freeze({
  astroWeb: Object.freeze({ executionClass: "linuxSandbox", toolchain: "astroNodePnpm" }),
  flutterWeb: Object.freeze({ executionClass: "linuxSandbox", toolchain: "flutterWeb" }),
  flutterAndroid: Object.freeze({ executionClass: "linuxSandbox", toolchain: "flutterAndroidGradle" }),
  flutterWindows: Object.freeze({ executionClass: "windowsVm", toolchain: "flutterWindowsMsvc" }),
  flutterIos: Object.freeze({ executionClass: "macosXcode", toolchain: "flutterIosXcode" }),
});
const opaque = /^[A-Za-z0-9._:-]{1,128}$/;
const version = /^[A-Za-z0-9._+-]{1,64}$/;
const digest = /^[a-f0-9]{64}$/i;

/** Pure, fail-closed selection. Evidence is injected; this function performs no provider or host operation. */
export function resolveCompilationRoute(input: {
  readonly tenantId?: string;
  readonly target: unknown;
  readonly project: ProjectCapabilityDetection;
  readonly workers: readonly CompilationWorkerEvidence[];
  readonly evidenceVerifier?: CompilationWorkerEvidenceVerifier | undefined;
  readonly now?: Date;
}): CompilationRoute {
  const target = isTarget(input.target) ? input.target : null;
  if (target === null) return unavailable(null, "unknownTarget");
  const now = input.now ?? new Date();
  if (!validProject(input.project, now)) return unavailable(target, "invalidProjectEvidence");
  if (!input.project.declaredTargets.includes(target)) return unavailable(target, "targetNotDeclared");
  const expected = routeTable[target];
  const tenantId = input.tenantId;
  const verifier = input.evidenceVerifier;
  if (tenantId === undefined || !opaque.test(tenantId) || verifier === undefined) return unavailable(target, "workerUnproved");
  const requirementDigest = compilationRouteRequirementDigest({ tenantId, project: input.project, target, ...expected });
  const requirement: CompilationRouteRequirement = Object.freeze({
    contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION, tenantId, projectId: input.project.projectId,
    sourceRevision: input.project.sourceRevision, repositoryDigest: input.project.repositoryDigest,
    projectEvidenceDigest: input.project.evidenceDigest, target, ...expected,
    requiredCapabilities: Object.freeze([...COMPILATION_WORKER_CAPABILITIES]), requirementDigest,
  });
  const candidates = input.workers.filter((item) => item.executionClass === expected.executionClass);
  if (candidates.length === 0) return unavailable(target, "workerUnconfigured");
  const toolchains = candidates.filter((item) => item.toolchain === expected.toolchain);
  if (toolchains.length === 0) return unavailable(target, "toolchainUnproved");
  const valid = toolchains.filter((item) => validWorker(item, requirement, verifier, now));
  if (valid.length !== 1) return unavailable(target, valid.length === 0 ? "workerUnproved" : "incompatibleWorker");
  const worker = valid[0];
  if (worker === undefined) return unavailable(target, "workerUnproved");
  const expiresAt = earlierExpiry(input.project.expiresAt, worker.expiresAt);
  const routeDigest = sha256(JSON.stringify([
    COMPILATION_ROUTING_CONTRACT_VERSION, target, expected.executionClass, expected.toolchain,
    input.project.projectId, input.project.sourceRevision, input.project.repositoryDigest,
    input.project.evidenceDigest, requirementDigest, worker.workerId, worker.resourceIdentityDigest, worker.runtimeIdentityDigest, worker.policyDigest,
    worker.evidenceDigest, expiresAt,
  ]));
  return Object.freeze({
    supported: true as const,
    contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION,
    target,
    executionClass: expected.executionClass,
    toolchain: expected.toolchain,
    requiredCapabilities: Object.freeze([...COMPILATION_WORKER_CAPABILITIES]),
    projectEvidenceDigest: input.project.evidenceDigest,
    workerEvidenceDigest: worker.evidenceDigest,
    routeDigest,
    expiresAt,
  });
}

function validProject(value: ProjectCapabilityDetection, now: Date): boolean {
  if ((value as { readonly contractVersion: unknown }).contractVersion !== COMPILATION_ROUTING_CONTRACT_VERSION || !opaque.test(value.projectId) || !digest.test(value.repositoryDigest) || !digest.test(value.evidenceDigest)) return false;
  if (!/^[a-f0-9]{7,64}$/i.test(value.sourceRevision) || !validWindow(value.observedAt, value.expiresAt, now)) return false;
  if (value.declaredTargets.length === 0 || value.declaredTargets.length !== new Set(value.declaredTargets).size || value.declaredTargets.some((item) => !isTarget(item))) return false;
  if (value.projectKind === "astro" && (value.declaredTargets.length !== 1 || value.declaredTargets[0] !== "astroWeb")) return false;
  if (value.projectKind === "flutter" && value.declaredTargets.some((item) => item === "astroWeb")) return false;
  const artifacts: unknown = value.artifactDigests;
  if (!isArtifactDigests(artifacts, value.projectKind, value.declaredTargets)) return false;
  const expectedDigest = projectCapabilityEvidenceDigest({ ...value, artifactDigests: artifacts });
  return expectedDigest === value.evidenceDigest;
}

function validArtifactDigest(value: { readonly path: string; readonly digest: string }): boolean {
  return /^(?:site|app)\/[A-Za-z0-9._/-]{1,192}$/.test(value.path) && !value.path.split("/").includes("..") && digest.test(value.digest);
}

function isArtifactDigests(value: unknown, projectKind: ProjectCapabilityDetection["projectKind"], targets: readonly CompilationTarget[]): value is readonly { readonly path: string; readonly digest: string }[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 16) return false;
  const records: { readonly path: string; readonly digest: string }[] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return false;
    const record = item as Record<string, unknown>;
    if (Object.keys(record).length !== 2 || typeof record["path"] !== "string" || typeof record["digest"] !== "string") return false;
    const parsed = { path: record["path"], digest: record["digest"] };
    if (!validArtifactDigest(parsed)) return false;
    records.push(parsed);
  }
  const paths = records.map((item) => item.path);
  if (new Set(paths).size !== records.length || paths.some((path, index) => index > 0 && (paths[index - 1] ?? "") >= path)) return false;
  if (projectKind === "astro") return exactPaths(paths, ["site/package.json", "site/pnpm-lock.yaml"]);
  const expected = ["app/pubspec.lock", "app/pubspec.yaml"];
  if (targets.includes("flutterWeb")) expected.push("app/web/index.html");
  if (targets.includes("flutterWindows")) expected.push("app/windows/CMakeLists.txt");
  if (targets.includes("flutterIos")) expected.push("app/ios/Runner.xcodeproj/project.pbxproj");
  if (targets.includes("flutterAndroid")) {
    const androidMarkers = paths.filter((path) => path === "app/android/settings.gradle" || path === "app/android/settings.gradle.kts");
    if (androidMarkers.length !== 1) return false;
    expected.push(androidMarkers[0] ?? "");
  }
  expected.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  return exactPaths(paths, expected);
}

function exactPaths(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && actual.every((path, index) => path === expected[index]);
}

function validWorker(value: CompilationWorkerEvidence, requirement: CompilationRouteRequirement, verifier: CompilationWorkerEvidenceVerifier, now: Date): boolean {
  if ((value as { readonly contractVersion: unknown }).contractVersion !== COMPILATION_ROUTING_CONTRACT_VERSION || !opaque.test(value.tenantId) || !opaque.test(value.projectId) || !opaque.test(value.workerId) || !version.test(value.toolchainVersion)) return false;
  if (!EXECUTION_CLASSES.includes(value.executionClass) || !COMPILATION_TOOLCHAINS.includes(value.toolchain)) return false;
  if (![value.repositoryDigest, value.projectEvidenceDigest, value.routeRequirementDigest, value.resourceIdentityDigest, value.runtimeIdentityDigest, value.policyDigest, value.authorityDigest, value.evidenceDigest].every((item) => digest.test(item))) return false;
  if (!validWindow(value.observedAt, value.expiresAt, now)) return false;
  const exact = value.tenantId === requirement.tenantId && value.projectId === requirement.projectId && value.sourceRevision === requirement.sourceRevision &&
    value.repositoryDigest === requirement.repositoryDigest && value.projectEvidenceDigest === requirement.projectEvidenceDigest && value.target === requirement.target &&
    value.executionClass === requirement.executionClass && value.toolchain === requirement.toolchain && value.routeRequirementDigest === requirement.requirementDigest &&
    value.capabilities.length === COMPILATION_WORKER_CAPABILITIES.length && new Set(value.capabilities).size === COMPILATION_WORKER_CAPABILITIES.length &&
    COMPILATION_WORKER_CAPABILITIES.every((item, index) => value.capabilities[index] === item) &&
    value.evidenceDigest === compilationWorkerEvidenceDigest(value);
  if (!exact) return false;
  try { return verifier.verify({ evidence: deepFreezeEvidence(value), requirement }); } catch { return false; }
}

function deepFreezeEvidence(value: CompilationWorkerEvidence): CompilationWorkerEvidence {
  return Object.freeze({ ...value, capabilities: Object.freeze([...value.capabilities]) });
}

function validWindow(observedAt: string, expiresAt: string, now: Date): boolean {
  const observed = Date.parse(observedAt);
  const expires = Date.parse(expiresAt);
  return Number.isFinite(observed) && Number.isFinite(expires) && observed <= now.getTime() && expires > now.getTime() && expires - observed <= 15 * 60 * 1000;
}

function isTarget(value: unknown): value is CompilationTarget { return typeof value === "string" && (COMPILATION_TARGETS as readonly string[]).includes(value); }
function earlierExpiry(left: string, right: string): string { return Date.parse(left) <= Date.parse(right) ? left : right; }
function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function unavailable(target: CompilationTarget | null, reason: Extract<CompilationRoute, { supported: false }>["reason"]): CompilationRoute {
  return Object.freeze({ supported: false as const, contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION, target, reason });
}
