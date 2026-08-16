export const STUDIO_BRIDGE_VERSION = "shipglows.studio.bridge.v1" as const;
export const STUDIO_CONTRACT_VERSION = "shipglows.studio.v1" as const;
export const STUDIO_PROFILE_ID = "shipglows.astro.hero.v1" as const;
export const STUDIO_PARENT_ORIGIN = "http://127.0.0.1:3005" as const;
export const STUDIO_COMMAND_LIMIT_BYTES = 16 * 1024;
export const STUDIO_MESSAGE_LIMIT_BYTES = 256 * 1024;

export type HeroPreviewCapability =
  | "token.set"
  | "spacing.set"
  | "radius.set"
  | "opacity.set"
  | "transform.set"
  | "visibility.set"
  | "motion.duration"
  | "motion.easing";

type LayoutIntent = "flow" | "flex" | "grid";

export type HeroStudioAnchorId =
  | "hero.root"
  | "hero.copy"
  | "hero.eyebrow"
  | "hero.title"
  | "hero.body"
  | "hero.points"
  | "hero.actions"
  | "hero.panel";

interface HeroStudioAnchorDefinition {
  readonly label: string;
  readonly parentId: HeroStudioAnchorId | null;
  readonly order: number;
  readonly layoutIntent: LayoutIntent;
  readonly source: {
    readonly path: "site/src/components/Hero.astro";
    readonly symbol: string;
    readonly confidence: "exact";
  };
  readonly capabilities: readonly HeroPreviewCapability[];
}

const source = (symbol: string) => ({
  path: "site/src/components/Hero.astro" as const,
  symbol,
  confidence: "exact" as const,
});

export const HERO_STUDIO_ANCHORS = Object.freeze({
  "hero.root": {
    label: "Hero", parentId: null, order: 0, layoutIntent: "grid", source: source("Hero"),
    capabilities: ["token.set", "spacing.set", "radius.set"],
  },
  "hero.copy": {
    label: "Hero copy", parentId: "hero.root", order: 0, layoutIntent: "flow", source: source("Hero.copy"),
    capabilities: ["spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
  "hero.eyebrow": {
    label: "Eyebrow", parentId: "hero.copy", order: 0, layoutIntent: "flow", source: source("Hero.eyebrow"),
    capabilities: ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
  "hero.title": {
    label: "Title", parentId: "hero.copy", order: 1, layoutIntent: "flow", source: source("Hero.title"),
    capabilities: ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
  "hero.body": {
    label: "Body", parentId: "hero.copy", order: 2, layoutIntent: "flow", source: source("Hero.body"),
    capabilities: ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
  "hero.points": {
    label: "Proof points", parentId: "hero.copy", order: 3, layoutIntent: "grid", source: source("Hero.points"),
    capabilities: ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
  "hero.actions": {
    label: "Actions", parentId: "hero.copy", order: 4, layoutIntent: "flex", source: source("Hero.actions"),
    capabilities: ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
  "hero.panel": {
    label: "Product panel", parentId: "hero.root", order: 1, layoutIntent: "grid", source: source("Hero.panel"),
    capabilities: ["token.set", "spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"],
  },
} as const satisfies Record<HeroStudioAnchorId, HeroStudioAnchorDefinition>);

export interface StudioBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StudioAnchorSnapshot extends HeroStudioAnchorDefinition {
  readonly id: HeroStudioAnchorId;
  readonly bounds: StudioBounds;
}

export interface StudioReadyAnchor {
  readonly id: HeroStudioAnchorId;
  readonly label: string;
  readonly sourceSymbol: string;
  readonly capabilities: readonly HeroPreviewCapability[];
}

export interface StudioSelectedAnchor extends StudioReadyAnchor {
  readonly bounds: StudioBounds;
}

export function studioAnchorAttributes(anchorId: HeroStudioAnchorId): Record<string, string> {
  if (!import.meta.env.DEV) return {};
  return {
    "data-sg-studio-anchor": anchorId,
    "data-sg-studio-profile": STUDIO_PROFILE_ID,
  };
}

export type StudioAttachMessage = Readonly<{
  version: typeof STUDIO_BRIDGE_VERSION;
  type: "studio.attach";
  channelId: string;
}>;

export type StudioSelectMessage = Readonly<{
  version: typeof STUDIO_BRIDGE_VERSION;
  type: "studio.select";
  channelId: string;
  anchorId: HeroStudioAnchorId;
}>;

export interface StudioPreviewCommand {
  readonly commandId: string;
  readonly revision: number;
  readonly anchorId: HeroStudioAnchorId;
  readonly capability: HeroPreviewCapability;
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
}

export type StudioCommandsMessage = Readonly<{
  version: typeof STUDIO_BRIDGE_VERSION;
  type: "studio.commands";
  channelId: string;
  revision: number;
  commands: readonly StudioPreviewCommand[];
}>;

export type StudioHostMessage = StudioAttachMessage | StudioSelectMessage | StudioCommandsMessage;

export type StudioReadyMessage = Readonly<{
  version: typeof STUDIO_BRIDGE_VERSION;
  type: "studio.ready";
  channelId: string;
  profileId: typeof STUDIO_PROFILE_ID;
  anchors: readonly StudioReadyAnchor[];
}>;

export type StudioSelectedMessage = Readonly<{
  version: typeof STUDIO_BRIDGE_VERSION;
  type: "studio.selected";
  channelId: string;
  anchor: StudioSelectedAnchor;
}>;

const channelPattern = /^[A-Za-z0-9_-]{8,128}$/;
const commandPattern = /^[A-Za-z0-9._:-]{1,128}$/;

function isRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

export function isWithinStudioMessageLimit(input: unknown): boolean {
  return isWithinByteLimit(input, STUDIO_MESSAGE_LIMIT_BYTES);
}

export function isWithinStudioCommandLimit(input: unknown): boolean {
  return isWithinByteLimit(input, STUDIO_COMMAND_LIMIT_BYTES);
}

function isWithinByteLimit(input: unknown, maximumBytes: number): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(input)).byteLength <= maximumBytes;
  } catch {
    return false;
  }
}

function isHeroAnchorId(input: unknown): input is HeroStudioAnchorId {
  return typeof input === "string" && input in HERO_STUDIO_ANCHORS;
}

function isFiniteRange(input: unknown, minimum: number, maximum: number): input is number {
  return typeof input === "number" && Number.isFinite(input) && input >= minimum && input <= maximum;
}

function parseParameters(capability: StudioPreviewCommand["capability"], input: unknown): Readonly<Record<string, string | number | boolean>> | null {
  if (!isRecord(input)) return null;
  if (capability === "token.set") {
    if (!hasExactKeys(input, ["token", "value"])) return null;
    if (!["color.accent", "color.panel"].includes(String(input.token)) || !["brand", "mint", "amber", "violet"].includes(String(input.value))) return null;
  } else if (capability === "spacing.set") {
    if (!hasExactKeys(input, ["property", "value"]) || !["gap", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"].includes(String(input.property)) || !isFiniteRange(input.value, 0, 256)) return null;
  } else if (capability === "radius.set") {
    if (!hasExactKeys(input, ["corner", "value"]) || !["all", "topLeft", "topRight", "bottomRight", "bottomLeft"].includes(String(input.corner)) || !isFiniteRange(input.value, 0, 256)) return null;
  } else if (capability === "opacity.set") {
    if (!hasExactKeys(input, ["value"]) || !isFiniteRange(input.value, 0, 1)) return null;
  } else if (capability === "transform.set") {
    if (!hasExactKeys(input, ["axis", "value"]) || !["translateX", "translateY", "rotate", "scale"].includes(String(input.axis))) return null;
    const range = input.axis === "scale" ? [0.5, 1.5] : input.axis === "rotate" ? [-20, 20] : [-96, 96];
    if (!isFiniteRange(input.value, range[0]!, range[1]!)) return null;
  } else if (capability === "visibility.set") {
    if (!hasExactKeys(input, ["visible"]) || typeof input.visible !== "boolean") return null;
  } else if (capability === "motion.duration") {
    if (!hasExactKeys(input, ["milliseconds"]) || !isFiniteRange(input.milliseconds, 0, 1_000)) return null;
  } else if (capability === "motion.easing") {
    if (!hasExactKeys(input, ["easing"]) || !["linear", "ease", "ease-in", "ease-out", "ease-in-out"].includes(String(input.easing))) return null;
  } else {
    return null;
  }
  return input as Readonly<Record<string, string | number | boolean>>;
}

function parsePreviewCommand(input: unknown): StudioPreviewCommand | null {
  if (!isWithinStudioCommandLimit(input) || !isRecord(input)) return null;
  const required = ["schemaVersion", "commandId", "sessionId", "kind", "parameters", "affectedRuntimeNodeIds", "affectedDimensions", "provenance", "revision", "idempotencyKey", "previewOnly", "requiredCapability", "requiredUnprotectedDimensions"];
  const allowed = [...required, "compactionKey"];
  const keys = Object.keys(input);
  if (required.some((key) => !keys.includes(key)) || keys.some((key) => !allowed.includes(key))) return null;
  if (input.schemaVersion !== STUDIO_CONTRACT_VERSION || input.previewOnly !== true || input.requiredCapability !== input.kind) return null;
  for (const key of ["commandId", "sessionId", "idempotencyKey"] as const) if (typeof input[key] !== "string" || !commandPattern.test(input[key])) return null;
  if (input.compactionKey !== undefined && (typeof input.compactionKey !== "string" || !commandPattern.test(input.compactionKey))) return null;
  if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 1) return null;
  if (!Array.isArray(input.affectedRuntimeNodeIds) || input.affectedRuntimeNodeIds.length !== 1 || !isHeroAnchorId(input.affectedRuntimeNodeIds[0])) return null;
  const anchorId = input.affectedRuntimeNodeIds[0];
  const capability = input.kind;
  if (typeof capability !== "string" || !HERO_STUDIO_ANCHORS[anchorId].capabilities.includes(capability as never)) return null;
  const parameters = parseParameters(capability as StudioPreviewCommand["capability"], input.parameters);
  if (!parameters) return null;
  const dimensions = ["copy", "design", "structure", "function", "motion", "accessibility", "performance"];
  const affectedDimensions = input.affectedDimensions;
  if (!Array.isArray(affectedDimensions) || affectedDimensions.length === 0 || new Set(affectedDimensions).size !== affectedDimensions.length || affectedDimensions.some((item) => typeof item !== "string" || !dimensions.includes(item))) return null;
  if (!Array.isArray(input.requiredUnprotectedDimensions) || new Set(input.requiredUnprotectedDimensions).size !== input.requiredUnprotectedDimensions.length || input.requiredUnprotectedDimensions.some((item) => typeof item !== "string" || !affectedDimensions.includes(item))) return null;
  if (!isRecord(input.provenance) || !hasExactKeys(input.provenance, ["actorType", "actorId"]) || input.provenance.actorType !== "operator" || typeof input.provenance.actorId !== "string" || !commandPattern.test(input.provenance.actorId)) return null;
  return { commandId: input.commandId as string, revision: input.revision as number, anchorId, capability: capability as StudioPreviewCommand["capability"], parameters };
}

export function parseStudioHostMessage(input: unknown): StudioHostMessage | null {
  if (!isWithinStudioMessageLimit(input) || !isRecord(input) || input.version !== STUDIO_BRIDGE_VERSION || typeof input.channelId !== "string" || !channelPattern.test(input.channelId)) return null;
  if (input.type === "studio.attach" && hasExactKeys(input, ["version", "type", "channelId"])) return input as StudioAttachMessage;
  if (input.type === "studio.select" && hasExactKeys(input, ["version", "type", "channelId", "anchorId"]) && isHeroAnchorId(input.anchorId)) return input as StudioSelectMessage;
  if (input.type === "studio.commands" && hasExactKeys(input, ["version", "type", "channelId", "revision", "commands"])) {
    if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 0 || !Array.isArray(input.commands) || input.commands.length > 128) return null;
    const commands = input.commands.map(parsePreviewCommand);
    if (commands.some((command) => command === null)) return null;
    const parsed = commands as StudioPreviewCommand[];
    if (new Set(parsed.map((command) => command.commandId)).size !== parsed.length || parsed.some((command, index) => command.revision > (input.revision as number) || (index > 0 && command.revision <= parsed[index - 1]!.revision))) return null;
    return { version: STUDIO_BRIDGE_VERSION, type: "studio.commands", channelId: input.channelId, revision: input.revision as number, commands: parsed };
  }
  return null;
}

export function parseStudioAttachMessage(input: unknown): StudioAttachMessage | null {
  const message = parseStudioHostMessage(input);
  return message?.type === "studio.attach" ? message : null;
}

export function isTrustedStudioOrigin(origin: string, expectedOrigin: string = STUDIO_PARENT_ORIGIN): boolean {
  try {
    return origin === new URL(expectedOrigin).origin && origin === expectedOrigin;
  } catch {
    return false;
  }
}

function readyAnchor(anchor: StudioAnchorSnapshot): StudioReadyAnchor {
  return { id: anchor.id, label: anchor.label, sourceSymbol: anchor.source.symbol, capabilities: anchor.capabilities };
}

export function createStudioReadyMessage(channelId: string, anchors: readonly StudioAnchorSnapshot[]): StudioReadyMessage {
  return { version: STUDIO_BRIDGE_VERSION, type: "studio.ready", channelId, profileId: STUDIO_PROFILE_ID, anchors: anchors.map(readyAnchor) };
}

export function createStudioSelectedMessage(channelId: string, anchor: StudioAnchorSnapshot): StudioSelectedMessage {
  return { version: STUDIO_BRIDGE_VERSION, type: "studio.selected", channelId, anchor: { ...readyAnchor(anchor), bounds: anchor.bounds } };
}
