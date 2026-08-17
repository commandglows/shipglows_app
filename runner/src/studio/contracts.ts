export const STUDIO_CONTRACT_VERSION = "shipglows.studio.v1" as const;

export const STUDIO_LIMITS = Object.freeze({
  maxNodes: 256,
  maxCommandsPerVariant: 128,
  maxVariants: 8,
  maxViewports: 3,
  maxCompileRuns: 1,
  maxRequestBytes: 16 * 1024,
  maxBridgeMessageBytes: 256 * 1024,
  idleTimeoutSeconds: 30 * 60,
  absoluteTimeoutSeconds: 4 * 60 * 60,
});

export const STUDIO_CAPABILITIES = [
  "token.set", "typography.set", "color.set", "spacing.set", "radius.set",
  "opacity.set", "layout.reorder", "transform.set", "visibility.set",
  "state.set", "motion.duration", "motion.easing",
] as const;

export type StudioTarget = "astro";
export type StudioCapability = (typeof STUDIO_CAPABILITIES)[number];
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
  readonly sessionId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly actorId: string;
  readonly sourceCommit: string;
  readonly repositoryDigest: string;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
  readonly target: StudioTarget;
  readonly commands: readonly VisualCommand[];
  readonly undoCursor: number;
  readonly variants: readonly { readonly variantId: string; readonly name: string }[];
  readonly activeVariantId: string | null;
  readonly state: StudioState;
  readonly revision: number;
  readonly idleExpiresAt: string;
  readonly absoluteExpiresAt: string;
  readonly cleanupState: "active" | "pending" | "cleaned" | "quarantined";
  readonly interruptionReason?: string;
}

export interface CompileIntent {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly intentId: string;
  readonly sessionId: string;
  readonly variantId: string;
  readonly frozenCommandRevision: number;
  readonly sourceCommit: string;
  readonly repositoryDigest: string;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
  readonly affectedSurfaceIds: readonly string[];
  readonly affectedDimensions: readonly StudioDimension[];
  readonly predictedImpactPaths: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly actorId: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly status: "preflight" | "accepted" | "running" | "verified" | "failed" | "conflict";
}

export interface RenderEvidence {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly compileRunId: string;
  readonly sourceCommit: string;
  readonly targetRevision: string;
  readonly patchDigest: string;
  readonly captures: readonly { readonly viewportId: string; readonly beforeDigest: string; readonly afterDigest: string }[];
  readonly checks: Readonly<Record<"semantics" | "keyboard" | "contrast" | "reducedMotion" | "console" | "performance", "passed" | "failed">>;
  readonly verdict: "passed" | "failed";
  readonly failures: readonly string[];
  readonly cleanupState: "pending" | "cleaned" | "quarantined";
  readonly rollbackRevision: string;
}

export interface StudioTargetProfile {
  readonly schemaVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly profileId: "shipglows.astro.hero.v1" | "gocharbon.astro.hero.v1";
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly target: StudioTarget;
  readonly targetRoot: "site/";
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
  readonly capabilities: readonly StudioCapability[];
  readonly allowedSourceRoots: readonly string[];
  readonly fixtureIds: readonly string[];
  readonly runtime: { readonly packageManager: "pnpm"; readonly packageManagerVersion: string; readonly runtimeVersion: string };
  readonly limits: typeof STUDIO_LIMITS;
  readonly isolation: "trustedFirstPartyBaseOnly";
  readonly productionExcluded: true;
}

export class StudioContractError extends Error {
  constructor(message: string) { super(message); this.name = "StudioContractError"; }
}

const capabilities = new Set<string>(STUDIO_CAPABILITIES);
const dimensions = new Set<StudioDimension>(["copy", "design", "structure", "function", "motion", "accessibility", "performance"]);
const commandKeys = new Set(["schemaVersion", "commandId", "sessionId", "kind", "parameters", "affectedRuntimeNodeIds", "affectedDimensions", "provenance", "revision", "idempotencyKey", "previewOnly", "requiredCapability", "requiredUnprotectedDimensions", "compactionKey"]);
const opaque = /^[A-Za-z0-9._:-]{1,128}$/;
const semanticCode = /^[A-Za-z][A-Za-z0-9_.-]{0,127}$/;
const revisionPattern = /^[a-f0-9]{7,64}$/i;
const digestPattern = /^[a-f0-9]{64}$/i;

function assertClosedRecord(value: unknown, allowedKeys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new StudioContractError(`${label} must be an object.`);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedKeys.includes(key))) throw new StudioContractError(`${label} contains an additional property.`);
  return record;
}

function assertFiniteNumber(value: unknown, minimum: number, maximum: number, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) throw new StudioContractError(`${label} is invalid.`);
}

function assertSemanticCode(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !semanticCode.test(value)) throw new StudioContractError(`${label} is invalid.`);
}

function parseCommandParameters(kind: StudioCapability, input: unknown): Readonly<Record<string, string | number | boolean>> {
  const value = assertClosedRecord(input, parameterKeys[kind], "Visual command parameters");
  switch (kind) {
    case "token.set":
      if (!["color.accent", "color.panel"].includes(String(value["token"])) || !["brand", "mint", "amber", "violet"].includes(String(value["value"]))) throw new StudioContractError("Token preset is invalid.");
      break;
    case "typography.set":
      if (!["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"].includes(String(value["property"]))) throw new StudioContractError("Typography property is invalid.");
      assertSemanticCode(value["token"], "token");
      break;
    case "color.set":
      if (!["foreground", "background", "border", "accent"].includes(String(value["property"]))) throw new StudioContractError("Color property is invalid.");
      assertSemanticCode(value["token"], "token");
      break;
    case "spacing.set":
      if (!["gap", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"].includes(String(value["property"]))) throw new StudioContractError("Spacing property is invalid.");
      assertFiniteNumber(value["value"], 0, 256, "spacing value");
      break;
    case "radius.set":
      if (!["all", "topLeft", "topRight", "bottomRight", "bottomLeft"].includes(String(value["corner"]))) throw new StudioContractError("Radius corner is invalid.");
      assertFiniteNumber(value["value"], 0, 256, "radius value");
      break;
    case "opacity.set":
      assertFiniteNumber(value["value"], 0, 1, "opacity value");
      break;
    case "layout.reorder":
      if (!Number.isSafeInteger(value["fromIndex"]) || !Number.isSafeInteger(value["toIndex"]) || (value["fromIndex"] as number) < 0 || (value["toIndex"] as number) < 0 || (value["fromIndex"] as number) >= STUDIO_LIMITS.maxNodes || (value["toIndex"] as number) >= STUDIO_LIMITS.maxNodes) throw new StudioContractError("Layout order is invalid.");
      break;
    case "transform.set":
      if (!["translateX", "translateY", "rotate", "scale"].includes(String(value["axis"]))) throw new StudioContractError("Transform axis is invalid.");
      if (value["axis"] === "scale") assertFiniteNumber(value["value"], 0.5, 1.5, "transform value");
      else if (value["axis"] === "rotate") assertFiniteNumber(value["value"], -20, 20, "transform value");
      else assertFiniteNumber(value["value"], -96, 96, "transform value");
      break;
    case "visibility.set":
      if (typeof value["visible"] !== "boolean") throw new StudioContractError("Visibility value is invalid.");
      break;
    case "state.set":
      if (!["default", "hover", "focus", "active", "disabled"].includes(String(value["state"]))) throw new StudioContractError("State value is invalid.");
      break;
    case "motion.duration":
      assertFiniteNumber(value["milliseconds"], 0, 1_000, "motion duration");
      break;
    case "motion.easing":
      if (!["linear", "ease", "ease-in", "ease-out", "ease-in-out"].includes(String(value["easing"]))) throw new StudioContractError("Motion easing is invalid.");
      break;
  }
  return value as Readonly<Record<string, string | number | boolean>>;
}

const parameterKeys: Readonly<Record<StudioCapability, readonly string[]>> = {
  "token.set": ["token", "value"],
  "typography.set": ["property", "token"],
  "color.set": ["property", "token"],
  "spacing.set": ["property", "value"],
  "radius.set": ["corner", "value"],
  "opacity.set": ["value"],
  "layout.reorder": ["fromIndex", "toIndex"],
  "transform.set": ["axis", "value"],
  "visibility.set": ["visible"],
  "state.set": ["state"],
  "motion.duration": ["milliseconds"],
  "motion.easing": ["easing"],
};

export function parseVisualCommand(input: unknown): VisualCommand {
  let encoded: string;
  try { encoded = JSON.stringify(input); } catch { throw new StudioContractError("Visual command is not serializable."); }
  if (typeof encoded !== "string") throw new StudioContractError("Visual command must be an object.");
  if (Buffer.byteLength(encoded, "utf8") > STUDIO_LIMITS.maxRequestBytes) throw new StudioContractError("Visual command exceeds the request limit.");
  const value = assertClosedRecord(input, [...commandKeys], "Visual command");
  if (value["schemaVersion"] !== STUDIO_CONTRACT_VERSION || !capabilities.has(String(value["kind"])) || value["previewOnly"] !== true || value["requiredCapability"] !== value["kind"]) throw new StudioContractError("Visual command type or version is unsupported.");
  for (const key of ["commandId", "sessionId", "idempotencyKey"] as const) if (typeof value[key] !== "string" || !opaque.test(value[key])) throw new StudioContractError(`${key} is invalid.`);
  if (!Number.isSafeInteger(value["revision"]) || (value["revision"] as number) < 1) throw new StudioContractError("Visual command revision is invalid.");
  const kind = value["kind"] as StudioCapability;
  value["parameters"] = parseCommandParameters(kind, value["parameters"]);
  if (!Array.isArray(value["affectedRuntimeNodeIds"]) || value["affectedRuntimeNodeIds"].length !== 1 || value["affectedRuntimeNodeIds"].some((id) => typeof id !== "string" || !opaque.test(id))) throw new StudioContractError("Affected nodes are invalid.");
  if (!Array.isArray(value["affectedDimensions"]) || value["affectedDimensions"].length === 0 || new Set(value["affectedDimensions"]).size !== value["affectedDimensions"].length || value["affectedDimensions"].some((item) => !dimensions.has(item as StudioDimension))) throw new StudioContractError("affectedDimensions is invalid.");
  if (!Array.isArray(value["requiredUnprotectedDimensions"]) || new Set(value["requiredUnprotectedDimensions"]).size !== value["requiredUnprotectedDimensions"].length || value["requiredUnprotectedDimensions"].some((item) => !dimensions.has(item as StudioDimension))) throw new StudioContractError("requiredUnprotectedDimensions is invalid.");
  if (!(value["requiredUnprotectedDimensions"] as StudioDimension[]).every((item) => (value["affectedDimensions"] as StudioDimension[]).includes(item))) throw new StudioContractError("Required unprotected dimensions must be affected dimensions.");
  const provenance = assertClosedRecord(value["provenance"], ["actorType", "actorId"], "Command provenance");
  if (!(["operator", "agent"] as const).includes(provenance["actorType"] as "operator" | "agent") || typeof provenance["actorId"] !== "string" || !opaque.test(provenance["actorId"])) throw new StudioContractError("Command provenance is invalid.");
  if (value["compactionKey"] !== undefined && (typeof value["compactionKey"] !== "string" || !opaque.test(value["compactionKey"]))) throw new StudioContractError("Compaction key is invalid.");
  return value as unknown as VisualCommand;
}

export function studioBridgeMessageBytes(input: unknown): number {
  let encoded: string;
  try { encoded = JSON.stringify(input); } catch { throw new StudioContractError("Studio bridge message is not serializable."); }
  if (typeof encoded !== "string") throw new StudioContractError("Studio bridge message must be serializable.");
  return Buffer.byteLength(encoded, "utf8");
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
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly target: StudioTarget;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
  readonly requestedCapabilities: readonly StudioCapability[];
  readonly trustedFirstPartyBase: boolean;
}
export type TargetProfileNegotiation = { readonly supported: true; readonly capabilities: readonly StudioCapability[] } | { readonly supported: false; readonly capabilities: readonly []; readonly reason: "profileMismatch" | "unsupportedCapability" };

export function negotiateTargetProfile(profile: StudioTargetProfile, request: TargetProfileRequest): TargetProfileNegotiation {
  const exact = request.trustedFirstPartyBase &&
    runtimeTextEquals(profile.schemaVersion, STUDIO_CONTRACT_VERSION) &&
    (runtimeTextEquals(profile.profileId, "shipglows.astro.hero.v1") || runtimeTextEquals(profile.profileId, "gocharbon.astro.hero.v1")) &&
    runtimeBooleanEquals(profile.productionExcluded, true) && runtimeTextEquals(profile.isolation, "trustedFirstPartyBaseOnly") && runtimeTextEquals(profile.target, request.target) && runtimeTextEquals(profile.targetRoot, "site/") &&
    revisionPattern.test(profile.sourceRevision) && digestPattern.test(profile.repositoryDigest) &&
    profile.projectId === request.projectId && profile.sourceRevision === request.sourceRevision && profile.repositoryDigest === request.repositoryDigest &&
    profile.adapterVersion === request.adapterVersion && profile.capabilityVersion === request.capabilityVersion;
  if (!exact) return { supported: false, capabilities: [], reason: "profileMismatch" };
  if (request.requestedCapabilities.length === 0 || new Set(request.requestedCapabilities).size !== request.requestedCapabilities.length || request.requestedCapabilities.some((item) => !profile.capabilities.includes(item))) return { supported: false, capabilities: [], reason: "unsupportedCapability" };
  return { supported: true, capabilities: [...request.requestedCapabilities] };
}

export function isStudioRevision(value: string): boolean { return revisionPattern.test(value); }
export function isStudioDigest(value: string): boolean { return digestPattern.test(value); }
function runtimeTextEquals(value: unknown, expected: string): boolean { return typeof value === "string" && value === expected; }
function runtimeBooleanEquals(value: unknown, expected: boolean): boolean { return typeof value === "boolean" && value === expected; }
