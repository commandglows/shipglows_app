export const STUDIO_BRIDGE_VERSION = "shipglows.studio.bridge.v1" as const;
export const STUDIO_PROFILE_ID = "shipglows.astro.hero.v1" as const;

export const HERO_STUDIO_ANCHORS = Object.freeze({
  "hero.root": { label: "Hero", sourceSymbol: "Hero", capabilities: ["inspect"] },
  "hero.copy": { label: "Hero copy", sourceSymbol: "Hero.copy", capabilities: ["inspect"] },
  "hero.eyebrow": { label: "Eyebrow", sourceSymbol: "Hero.eyebrow", capabilities: ["inspect"] },
  "hero.title": { label: "Title", sourceSymbol: "Hero.title", capabilities: ["inspect"] },
  "hero.body": { label: "Body", sourceSymbol: "Hero.body", capabilities: ["inspect"] },
  "hero.points": { label: "Proof points", sourceSymbol: "Hero.points", capabilities: ["inspect"] },
  "hero.actions": { label: "Actions", sourceSymbol: "Hero.actions", capabilities: ["inspect"] },
  "hero.panel": { label: "Product panel", sourceSymbol: "Hero.panel", capabilities: ["inspect"] },
} as const);

export type HeroStudioAnchorId = keyof typeof HERO_STUDIO_ANCHORS;

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

const channelPattern = /^[A-Za-z0-9_-]{8,128}$/;

export function parseStudioAttachMessage(input: unknown): StudioAttachMessage | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value);
  if (keys.length !== 3 || !keys.every((key) => ["version", "type", "channelId"].includes(key))) return null;
  if (value["version"] !== STUDIO_BRIDGE_VERSION || value["type"] !== "studio.attach") return null;
  if (typeof value["channelId"] !== "string" || !channelPattern.test(value["channelId"])) return null;
  return value as StudioAttachMessage;
}

export function isTrustedStudioOrigin(origin: string, expectedOrigin: string): boolean {
  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin && origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}
