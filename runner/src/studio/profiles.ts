import type { StudioCapability, StudioDimension } from "./contracts.js";

export const STUDIO_BRIDGE_VERSION = "shipglows.studio.bridge.v1" as const;

export const STUDIO_PREVIEW_CAPABILITIES = Object.freeze([
  "token.set",
  "spacing.set",
  "radius.set",
  "opacity.set",
  "transform.set",
  "visibility.set",
  "motion.duration",
  "motion.easing",
] as const satisfies readonly StudioCapability[]);

const protectedDimensions = Object.freeze([
  "copy",
  "structure",
  "accessibility",
  "performance",
] as const satisfies readonly StudioDimension[]);

const surface = (
  id: string,
  label: string,
  sourceSymbol: string,
  capabilities: readonly StudioCapability[],
) => Object.freeze({
  id,
  label,
  sourceConfidence: "exact" as const,
  sourceSymbol,
  capabilities: Object.freeze([...capabilities]),
  protectedDimensions,
});

export const SHIPGLOWS_STUDIO_SURFACES = Object.freeze([
  surface("hero.root", "Hero", "Hero", ["token.set", "spacing.set", "radius.set"]),
  surface("hero.copy", "Hero copy", "Hero.copy", ["spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.eyebrow", "Eyebrow", "Hero.eyebrow", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.title", "Title", "Hero.title", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.body", "Body", "Hero.body", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.points", "Proof points", "Hero.points", ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.actions", "Actions", "Hero.actions", ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.panel", "Product panel", "Hero.panel", ["token.set", "spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
]);

export const GOCHARBON_STUDIO_SURFACES = Object.freeze([
  surface("hero.root", "Hero", "GoCharbonHero", ["token.set", "spacing.set", "radius.set"]),
  surface("hero.copy", "Hero copy", "GoCharbonHero.copy", ["spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.eyebrow", "Eyebrow", "GoCharbonHero.eyebrow", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.title", "Title", "GoCharbonHero.title", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.intro", "Intro", "GoCharbonHero.intro", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.actions", "Actions", "GoCharbonHero.actions", ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.miner", "Miner image", "GoCharbonHero.miner", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.depth", "Depth panel", "GoCharbonHero.depthPanel", ["token.set", "spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
]);

export const STUDIO_PROFILE_DEFINITIONS = Object.freeze({
  shipglows_app: Object.freeze({
    projectId: "shipglows_app",
    profileId: "shipglows.astro.hero.v1",
    previewOrigin: "http://127.0.0.1:3003",
    documentLimitBytes: 256 * 1024,
    expectedPaths: Object.freeze(["site/src/components/Hero.astro"]),
    surfaces: SHIPGLOWS_STUDIO_SURFACES,
  }),
  gocharbon: Object.freeze({
    projectId: "gocharbon",
    profileId: "gocharbon.astro.hero.v1",
    previewOrigin: "http://127.0.0.1:3002",
    documentLimitBytes: 512 * 1024,
    expectedPaths: Object.freeze(["site/src/pages/index.astro"]),
    surfaces: GOCHARBON_STUDIO_SURFACES,
  }),
} as const);

export type StudioProjectId = keyof typeof STUDIO_PROFILE_DEFINITIONS;
export type StudioProfileId = (typeof STUDIO_PROFILE_DEFINITIONS)[StudioProjectId]["profileId"];
export type StudioProfileDefinition = (typeof STUDIO_PROFILE_DEFINITIONS)[StudioProjectId];
export type StudioSurfaceDefinition = (typeof SHIPGLOWS_STUDIO_SURFACES)[number];

export function studioProfileForProject(projectId: string): StudioProfileDefinition | null {
  return projectId === "shipglows_app" || projectId === "gocharbon"
    ? STUDIO_PROFILE_DEFINITIONS[projectId]
    : null;
}

export function isStudioProfileId(profileId: string): profileId is StudioProfileId {
  return Object.values(STUDIO_PROFILE_DEFINITIONS).some((profile) => profile.profileId === profileId);
}

export function studioProfileForId(profileId: string): StudioProfileDefinition | null {
  return Object.values(STUDIO_PROFILE_DEFINITIONS).find((profile) => profile.profileId === profileId) ?? null;
}
