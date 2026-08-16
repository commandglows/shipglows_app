import { STUDIO_CONTRACT_VERSION, type StudioCapability } from "./contracts.js";

export const STUDIO_BRIDGE_VERSION = "shipglows.studio.bridge.v1" as const;
export const STUDIO_PROFILE_ID = "shipglows.astro.hero.v1" as const;

export interface StudioCapabilityProjection {
  readonly supported: true;
  readonly reason: "trustedFirstPartyBase";
  readonly contractVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly bridgeVersion: typeof STUDIO_BRIDGE_VERSION;
  readonly profileId: typeof STUDIO_PROFILE_ID;
  readonly previewOrigin: string;
  readonly capabilities: readonly ["inspect"];
  readonly surfaces: readonly {
    readonly id: string;
    readonly label: string;
    readonly sourceConfidence: "exact";
  }[];
}

export interface StudioCapabilityResolver {
  resolve(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
  }): Promise<StudioCapabilityProjection | null> | StudioCapabilityProjection | null;
}

const surfaceIds = [
  ["hero.root", "Hero"],
  ["hero.copy", "Hero copy"],
  ["hero.eyebrow", "Eyebrow"],
  ["hero.title", "Title"],
  ["hero.body", "Body"],
  ["hero.points", "Proof points"],
  ["hero.actions", "Actions"],
  ["hero.panel", "Product panel"],
] as const;

export function createTrustedBaseStudioCapability(input: {
  readonly projectId: string;
  readonly previewOrigin: string;
  readonly sourceRevision: string;
  readonly expectedSourceRevision: string;
  readonly repositoryDigest: string;
  readonly expectedRepositoryDigest: string;
  readonly requestedCapabilities: readonly (StudioCapability | "inspect")[];
}): StudioCapabilityProjection | null {
  let origin: URL;
  try {
    origin = new URL(input.previewOrigin);
  } catch {
    return null;
  }
  const exactLoopbackOrigin =
    origin.protocol === "http:" &&
    origin.hostname === "127.0.0.1" &&
    origin.port === "3003" &&
    origin.pathname === "/" &&
    origin.search === "" &&
    origin.hash === "";
  const exactProfile =
    input.projectId === "shipglows_app" &&
    input.sourceRevision === input.expectedSourceRevision &&
    input.repositoryDigest === input.expectedRepositoryDigest &&
    input.sourceRevision.length >= 7 &&
    input.repositoryDigest.length === 64;
  const readOnly =
    input.requestedCapabilities.length === 1 &&
    input.requestedCapabilities[0] === "inspect";
  if (!exactLoopbackOrigin || !exactProfile || !readOnly) return null;

  return {
    supported: true,
    reason: "trustedFirstPartyBase",
    contractVersion: STUDIO_CONTRACT_VERSION,
    bridgeVersion: STUDIO_BRIDGE_VERSION,
    profileId: STUDIO_PROFILE_ID,
    previewOrigin: origin.origin,
    capabilities: ["inspect"],
    surfaces: surfaceIds.map(([id, label]) => ({ id, label, sourceConfidence: "exact" })),
  };
}
