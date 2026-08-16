export const STUDIO_CONTRACT_VERSION = "shipglows.studio.v1" as const;

export const STUDIO_LIMITS = Object.freeze({
  maxNodes: 256,
  maxCommandsPerVariant: 128,
  maxVariants: 8,
  maxViewports: 3,
  maxCompileRuns: 1,
  maxRequestBytes: 16 * 1024,
  idleTimeoutSeconds: 30 * 60,
  absoluteTimeoutSeconds: 4 * 60 * 60,
});

export type StudioTarget = "astro";
export type StudioCapability =
  | "token.set" | "typography.set" | "color.set" | "spacing.set" | "radius.set"
  | "opacity.set" | "layout.reorder" | "transform.set" | "visibility.set"
  | "state.set" | "motion.duration" | "motion.easing";
export type StudioDimension = "copy" | "design" | "structure" | "function" | "motion" | "accessibility" | "performance";
export type StudioState = "unavailable" | "starting" | "ready" | "previewing" | "laboratory" | "compiling" | "verifying" | "verified" | "conflict" | "failed" | "interrupted" | "closed";

export interface StudioNode {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly surfaceId: string;
  readonly runtimeNodeId: string;
  readonly sourceAnchor: { readonly path: string; readonly symbol?: string; readonly confidence: "exact" | "ambiguous"; readonly revision: string };
  readonly target: StudioTarget;
  readonly parentId?: string;
  readonly order: number;
  readonly bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly layoutIntent: "flow" | "flex" | "grid" | "absolute" | "constraint";
  readonly tokenReferences: Readonly<Record<string, string>>;
  readonly resolvedValues: Readonly<Record<string, string | number | boolean>>;
  readonly capabilities: readonly StudioCapability[];
  readonly protection: Readonly<Record<StudioDimension, "unprotected" | "protected" | "unknown">>;
  readonly revision: number;
}

export interface VisualCommand {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly commandId: string;
  readonly sessionId: string;
  readonly kind: StudioCapability;
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
  readonly affectedRuntimeNodeIds: readonly string[];
  readonly affectedDimensions: readonly StudioDimension[];
  readonly provenance: { readonly actorType: "operator" | "agent"; readonly actorId: string };
  readonly revision: number;
  readonly idempotencyKey: string;
  readonly previewOnly: true;
  readonly requiredCapability: StudioCapability;
  readonly requiredUnprotectedDimensions: readonly StudioDimension[];
  readonly compactionKey?: string;
}

export interface LabSession {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly sessionId: string; readonly tenantId: string; readonly projectId: string; readonly actorId: string;
  readonly sourceCommit: string; readonly repositoryDigest: string; readonly adapterVersion: string; readonly capabilityVersion: string;
  readonly target: StudioTarget; readonly commands: readonly VisualCommand[]; readonly undoCursor: number;
  readonly variants: readonly { readonly variantId: string; readonly name: string }[]; readonly activeVariantId: string | null;
  readonly state: StudioState; readonly revision: number; readonly idleExpiresAt: string; readonly absoluteExpiresAt: string;
  readonly cleanupState: "active" | "pending" | "cleaned" | "quarantined"; readonly interruptionReason?: string;
}

export interface CompileIntent {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly intentId: string; readonly sessionId: string; readonly variantId: string; readonly frozenCommandRevision: number;
  readonly sourceCommit: string; readonly adapterVersion: string; readonly capabilityVersion: string;
  readonly affectedSurfaceIds: readonly string[]; readonly affectedDimensions: readonly StudioDimension[];
  readonly predictedImpactPaths: readonly string[]; readonly requiredEvidence: readonly string[];
  readonly actorId: string; readonly idempotencyKey: string; readonly createdAt: string;
  readonly status: "preflight" | "accepted" | "running" | "verified" | "failed" | "conflict";
}

export interface RenderEvidence {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly compileRunId: string; readonly sourceCommit: string; readonly targetRevision: string; readonly patchDigest: string;
  readonly captures: readonly { readonly viewportId: string; readonly beforeDigest: string; readonly afterDigest: string }[];
  readonly checks: Readonly<Record<"semantics" | "keyboard" | "contrast" | "reducedMotion" | "console" | "performance", "passed" | "failed">>;
  readonly verdict: "passed" | "failed"; readonly failures: readonly string[];
  readonly cleanupState: "pending" | "cleaned" | "quarantined"; readonly rollbackRevision: string;
}

export interface StudioTargetProfile {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly profileId: "shipglows.astro.hero.v1";
  readonly projectId: string; readonly sourceRevision: string; readonly repositoryDigest: string;
  readonly target: StudioTarget; readonly targetRoot: "site/"; readonly adapterVersion: string; readonly capabilityVersion: string;
  readonly capabilities: readonly StudioCapability[]; readonly allowedSourceRoots: readonly string[]; readonly fixtureIds: readonly string[];
  readonly runtime: { readonly packageManager: "pnpm"; readonly packageManagerVersion: string; readonly runtimeVersion: string };
  readonly limits: typeof STUDIO_LIMITS; readonly isolation: "trustedFirstPartyBaseOnly"; readonly productionExcluded: true;
}

export class StudioContractError extends Error {
  constructor(message: string) { super(message); this.name = "StudioContractError"; }
}

const capabilities = new Set<StudioCapability>(["token.set", "typography.set", "color.set", "spacing.set", "radius.set", "opacity.set", "layout.reorder", "transform.set", "visibility.set", "state.set", "motion.duration", "motion.easing"]);
const dimensions = new Set<StudioDimension>(["copy", "design", "structure", "function", "motion", "accessibility", "performance"]);
const commandKeys = new Set(["schemaVersion", "commandId", "sessionId", "kind", "parameters", "affectedRuntimeNodeIds", "affectedDimensions", "provenance", "revision", "idempotencyKey", "previewOnly", "requiredCapability", "requiredUnprotectedDimensions", "compactionKey"]);
const forbiddenParameterKeys = /^(css|javascript|shell|path|selector|prompt|source|command)$/i;
const opaque = /^[A-Za-z0-9._:-]{1,128}$/;

export function parseVisualCommand(input: unknown): VisualCommand {
  const bytes = Buffer.byteLength(JSON.stringify(input), "utf8");
  if (bytes > STUDIO_LIMITS.maxRequestBytes) throw new StudioContractError("Visual command exceeds the request limit.");
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw new StudioContractError("Visual command must be an object.");
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((key) => !commandKeys.has(key))) throw new StudioContractError("Visual command contains an additional property.");
  if (value["schemaVersion"] !== STUDIO_CONTRACT_VERSION || !capabilities.has(value["kind"] as StudioCapability) || value["previewOnly"] !== true || value["requiredCapability"] !== value["kind"]) throw new StudioContractError("Visual command type or version is unsupported.");
  for (const key of ["commandId", "sessionId", "idempotencyKey"] as const) if (typeof value[key] !== "string" || !opaque.test(value[key])) throw new StudioContractError(`${key} is invalid.`);
  if (!Number.isSafeInteger(value["revision"]) || (value["revision"] as number) < 0) throw new StudioContractError("Visual command revision is invalid.");
  if (value["parameters"] === null || typeof value["parameters"] !== "object" || Array.isArray(value["parameters"]) || Object.keys(value["parameters"]).some((key) => forbiddenParameterKeys.test(key))) throw new StudioContractError("Visual command parameters are not semantic or closed.");
  if (!Array.isArray(value["affectedRuntimeNodeIds"]) || value["affectedRuntimeNodeIds"].length === 0 || value["affectedRuntimeNodeIds"].length > STUDIO_LIMITS.maxNodes || value["affectedRuntimeNodeIds"].some((id) => typeof id !== "string" || !opaque.test(id))) throw new StudioContractError("Affected nodes are invalid.");
  for (const key of ["affectedDimensions", "requiredUnprotectedDimensions"] as const) if (!Array.isArray(value[key]) || value[key].some((item) => !dimensions.has(item as StudioDimension))) throw new StudioContractError(`${key} is invalid.`);
  const provenance = value["provenance"] as Record<string, unknown> | undefined;
  if (!provenance || Object.keys(provenance).some((key) => !["actorType", "actorId"].includes(key)) || !["operator", "agent"].includes(String(provenance["actorType"])) || typeof provenance["actorId"] !== "string" || !opaque.test(provenance["actorId"])) throw new StudioContractError("Command provenance is invalid.");
  return input as VisualCommand;
}

const transitions: Readonly<Record<StudioState, readonly StudioState[]>> = {
  unavailable: ["starting", "closed"], starting: ["ready", "failed", "closed"],
  ready: ["previewing", "laboratory", "conflict", "interrupted", "failed", "closed"],
  previewing: ["ready", "laboratory", "conflict", "interrupted", "failed", "closed"],
  laboratory: ["previewing", "compiling", "conflict", "interrupted", "failed", "closed"],
  compiling: ["verifying", "conflict", "failed", "interrupted"],
  verifying: ["verified", "conflict", "failed", "interrupted"], verified: ["closed"],
  conflict: ["laboratory", "closed"], failed: ["laboratory", "closed"], interrupted: ["closed"], closed: [],
};

export function transitionStudioState(from: StudioState, to: StudioState): StudioState {
  if (!transitions[from].includes(to)) throw new StudioContractError(`Studio transition ${from} -> ${to} is not allowed.`);
  return to;
}

export interface TargetProfileRequest {
  readonly projectId: string; readonly sourceRevision: string; readonly repositoryDigest: string; readonly target: StudioTarget;
  readonly adapterVersion: string; readonly capabilityVersion: string; readonly requestedCapabilities: readonly StudioCapability[];
  readonly trustedFirstPartyBase: boolean;
}
export type TargetProfileNegotiation = { readonly supported: true; readonly capabilities: readonly StudioCapability[] } | { readonly supported: false; readonly capabilities: readonly []; readonly reason: "profileMismatch" | "unsupportedCapability" };

export function negotiateTargetProfile(profile: StudioTargetProfile, request: TargetProfileRequest): TargetProfileNegotiation {
  const exact = request.trustedFirstPartyBase &&
    profile.projectId === request.projectId && profile.sourceRevision === request.sourceRevision && profile.repositoryDigest === request.repositoryDigest &&
    profile.adapterVersion === request.adapterVersion && profile.capabilityVersion === request.capabilityVersion;
  if (!exact) return { supported: false, capabilities: [], reason: "profileMismatch" };
  if (request.requestedCapabilities.some((item) => !profile.capabilities.includes(item))) return { supported: false, capabilities: [], reason: "unsupportedCapability" };
  return { supported: true, capabilities: [...request.requestedCapabilities] };
}
