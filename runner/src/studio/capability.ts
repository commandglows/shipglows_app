import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { STUDIO_CONTRACT_VERSION, isStudioDigest, isStudioRevision, type StudioCapability } from "./contracts.js";
import {
  SHIPGLOWS_STUDIO_SURFACES,
  STUDIO_BRIDGE_VERSION,
  STUDIO_PREVIEW_CAPABILITIES,
  studioProfileForId,
  studioProfileForProject,
  type StudioProfileId,
  type StudioProjectId,
  type StudioSurfaceDefinition,
} from "./profiles.js";

// Compatibility exports for the original ShipGlows pilot.
export { STUDIO_BRIDGE_VERSION, STUDIO_PREVIEW_CAPABILITIES } from "./profiles.js";
export const STUDIO_PROFILE_ID = "shipglows.astro.hero.v1" as const;
export const STUDIO_PROJECT_ID = "shipglows_app" as const;
export const STUDIO_SURFACES = SHIPGLOWS_STUDIO_SURFACES;

export interface StudioCapabilityProjection {
  readonly supported: true;
  readonly reason: "trustedFirstPartyBase";
  readonly contractVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly bridgeVersion: typeof STUDIO_BRIDGE_VERSION;
  readonly profileId: StudioProfileId;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly previewOrigin: string;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
  readonly capabilities: readonly StudioCapability[];
  readonly compileAdmission: {
    readonly available: false;
    readonly reason: "workerIsolationUnavailable";
    readonly message: string;
  };
  readonly expectedPaths: readonly string[];
  readonly surfaces: readonly StudioSurfaceDefinition[];
}

export interface StudioCapabilityAdmission {
  readonly projection: StudioCapabilityProjection;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
  readonly allowedImpactPaths: readonly string[];
  readonly requiredEvidence: readonly string[];
}

export interface StudioCapabilityResolver {
  resolve(input: StudioActorProject): Promise<StudioCapabilityProjection | null> | StudioCapabilityProjection | null;
  admit?(input: StudioActorProject): Promise<StudioCapabilityAdmission | null> | StudioCapabilityAdmission | null;
}

export interface StudioActorProject {
  readonly tenantId: string;
  readonly userId: string;
  readonly projectId: string;
}

export interface StudioRepositoryAttestor {
  attest(input: { readonly expectedSourceRevision: string; readonly expectedRepositoryDigest: string }): Promise<{ readonly sourceRevision: string; readonly repositoryDigest: string } | null>;
}

export interface StudioRuntimeAttestor {
  attest(input: {
    readonly previewOrigin: string;
    readonly sourceRevision: string;
    readonly repositoryDigest: string;
    readonly profileId: StudioProfileId;
    readonly surfaces: readonly StudioSurfaceDefinition[];
    readonly documentLimitBytes: number;
  }): Promise<{ readonly healthy: boolean; readonly profileId: string; readonly bridgeVersion: string } | null>;
}

export interface TrustedBaseStudioConfiguration {
  readonly projectId: StudioProjectId;
  readonly previewOrigin: string;
  readonly expectedSourceRevision: string;
  readonly expectedRepositoryDigest: string;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
}

const execFileAsync = promisify(execFile);

export class GitStudioRepositoryAttestor implements StudioRepositoryAttestor {
  constructor(private readonly projectRoot: string, private readonly cleanScope?: string) {}

  async attest(input: { readonly expectedSourceRevision: string; readonly expectedRepositoryDigest: string }): Promise<{ readonly sourceRevision: string; readonly repositoryDigest: string } | null> {
    if (!isStudioRevision(input.expectedSourceRevision) || !isStudioDigest(input.expectedRepositoryDigest)) return null;
    try {
      const sourceRevision = (await this.git(["rev-parse", "--verify", "HEAD"])).trim();
      if (sourceRevision !== input.expectedSourceRevision) return null;
      const dirty = (await this.git([
        "status", "--porcelain=v1", "--untracked-files=normal",
        ...(this.cleanScope === undefined ? [] : ["--", this.cleanScope]),
      ])).trim();
      if (dirty !== "") return null;
      const treeObject = (await this.git(["rev-parse", "--verify", "HEAD^{tree}"])).trim();
      if (!/^[a-f0-9]{40,64}$/i.test(treeObject)) return null;
      const repositoryDigest = createHash("sha256").update(`git-tree:${treeObject}\n`, "utf8").digest("hex");
      if (repositoryDigest !== input.expectedRepositoryDigest) return null;
      return { sourceRevision, repositoryDigest };
    } catch {
      return null;
    }
  }

  private async git(args: readonly string[]): Promise<string> {
    const result = await execFileAsync("git", [...args], {
      cwd: this.projectRoot,
      encoding: "utf8",
      maxBuffer: 256 * 1024,
      windowsHide: true,
    });
    return result.stdout;
  }
}

export class HttpStudioRuntimeAttestor implements StudioRuntimeAttestor {
  constructor(private readonly timeoutMs = 2_000) {}

  async attest(input: { readonly previewOrigin: string; readonly sourceRevision: string; readonly repositoryDigest: string; readonly profileId: StudioProfileId; readonly surfaces: readonly StudioSurfaceDefinition[]; readonly documentLimitBytes: number }): Promise<{ readonly healthy: true; readonly profileId: StudioProfileId; readonly bridgeVersion: typeof STUDIO_BRIDGE_VERSION } | null> {
    const profile = studioProfileForId(input.profileId);
    if (input.previewOrigin !== profile?.previewOrigin || input.surfaces !== profile.surfaces || input.documentLimitBytes !== profile.documentLimitBytes || !isExactStudioOrigin(input.previewOrigin)) return null;
    try {
      const response = await fetch(input.previewOrigin, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: { accept: "text/html" },
      });
      if (!response.ok || new URL(response.url).origin !== input.previewOrigin) return null;
      const document = await readBoundedBody(response, input.documentLimitBytes);
      if (!document.includes(`data-sg-studio-profile=\"${input.profileId}\"`) || input.surfaces.some((surface) => !document.includes(`data-sg-studio-anchor=\"${surface.id}\"`))) return null;
      const bridgeUrl = new URL("/src/studio/heroContract.ts", input.previewOrigin);
      const bridgeResponse = await fetch(bridgeUrl, { method: "GET", redirect: "error", signal: AbortSignal.timeout(this.timeoutMs), headers: { accept: "text/javascript" } });
      if (!bridgeResponse.ok || new URL(bridgeResponse.url).origin !== input.previewOrigin) return null;
      const bridge = await readBoundedBody(bridgeResponse, 64 * 1024);
      if (!bridge.includes(input.profileId) || !bridge.includes(STUDIO_BRIDGE_VERSION) || input.surfaces.some((surface) => !bridge.includes(`\"${surface.id}\"`))) return null;
      return { healthy: true, profileId: input.profileId, bridgeVersion: STUDIO_BRIDGE_VERSION };
    } catch {
      return null;
    }
  }
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<string> {
  const body: unknown = response.body;
  if (!isBodyStream(body)) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let result = "";
  let finished = false;
  try {
    do {
      const chunk = await reader.read();
      if (!isBodyChunk(chunk)) throw new Error("Studio runtime response body is invalid.");
      finished = chunk.done;
      if (!chunk.done) {
        size += chunk.value.byteLength;
        if (size > maximumBytes) throw new Error("Studio runtime response exceeds its limit.");
        result += decoder.decode(chunk.value, { stream: true });
      }
    } while (!finished);
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
}

interface StudioBodyReader { read(): Promise<unknown>; releaseLock(): void; }
function isBodyStream(value: unknown): value is { getReader(): StudioBodyReader } {
  return value !== null && typeof value === "object" && "getReader" in value && typeof value.getReader === "function";
}

function isBodyChunk(value: unknown): value is { readonly done: true } | { readonly done: false; readonly value: Uint8Array } {
  if (value === null || typeof value !== "object" || !("done" in value) || typeof value.done !== "boolean") return false;
  return value.done || ("value" in value && value.value instanceof Uint8Array);
}

export function createTrustedBaseStudioResolver(input: {
  readonly configuration: TrustedBaseStudioConfiguration;
  readonly repository: StudioRepositoryAttestor;
  readonly runtime: StudioRuntimeAttestor;
}): StudioCapabilityResolver {
  const admit = async (actor: StudioActorProject): Promise<StudioCapabilityAdmission | null> => {
    const configuration = input.configuration;
    const profile = studioProfileForProject(configuration.projectId);
    if (actor.projectId !== profile?.projectId || configuration.previewOrigin !== profile.previewOrigin) return null;
    const repository = await input.repository.attest({
      expectedSourceRevision: configuration.expectedSourceRevision,
      expectedRepositoryDigest: configuration.expectedRepositoryDigest,
    });
    if (repository === null) return null;
    const runtime = await input.runtime.attest({
      previewOrigin: configuration.previewOrigin,
      sourceRevision: repository.sourceRevision,
      repositoryDigest: repository.repositoryDigest,
      profileId: profile.profileId,
      surfaces: profile.surfaces,
      documentLimitBytes: profile.documentLimitBytes,
    });
    if (runtime?.healthy !== true || runtime.profileId !== profile.profileId || runtime.bridgeVersion !== STUDIO_BRIDGE_VERSION) return null;
    const projection = createTrustedBaseStudioCapability({
      projectId: actor.projectId,
      previewOrigin: configuration.previewOrigin,
      sourceRevision: repository.sourceRevision,
      expectedSourceRevision: configuration.expectedSourceRevision,
      repositoryDigest: repository.repositoryDigest,
      expectedRepositoryDigest: configuration.expectedRepositoryDigest,
      requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES,
      adapterVersion: configuration.adapterVersion,
      capabilityVersion: configuration.capabilityVersion,
    });
    if (projection === null) return null;
    return {
      projection,
      adapterVersion: configuration.adapterVersion,
      capabilityVersion: configuration.capabilityVersion,
      allowedImpactPaths: [...profile.expectedPaths],
      requiredEvidence: ["astro.check", "astro.test", "astro.build", "render.desktop", "render.intermediate", "render.mobile", "accessibility", "console", "performance"],
    };
  };
  return { admit, resolve: async (actor) => (await admit(actor))?.projection ?? null };
}

export function createTrustedBaseStudioCapability(input: {
  readonly projectId: string;
  readonly previewOrigin: string;
  readonly sourceRevision: string;
  readonly expectedSourceRevision: string;
  readonly repositoryDigest: string;
  readonly expectedRepositoryDigest: string;
  readonly requestedCapabilities: readonly StudioCapability[];
  readonly adapterVersion?: string;
  readonly capabilityVersion?: string;
}): StudioCapabilityProjection | null {
  const profile = studioProfileForProject(input.projectId);
  if (input.previewOrigin !== profile?.previewOrigin || !isExactStudioOrigin(input.previewOrigin)) return null;
  const exactProfile =
    input.sourceRevision === input.expectedSourceRevision &&
    input.repositoryDigest === input.expectedRepositoryDigest &&
    isStudioRevision(input.sourceRevision) && isStudioDigest(input.repositoryDigest);
  const expectedCapabilities = STUDIO_PREVIEW_CAPABILITIES;
  const exactCapabilities = input.requestedCapabilities.length === expectedCapabilities.length &&
    input.requestedCapabilities.every((capability, index) => capability === expectedCapabilities[index]);
  const adapterVersion = input.adapterVersion ?? "astro.hero.v1";
  const capabilityVersion = input.capabilityVersion ?? STUDIO_CONTRACT_VERSION;
  if (!exactProfile || !exactCapabilities || !/^[A-Za-z0-9._-]{1,64}$/.test(adapterVersion) || !/^[A-Za-z0-9._-]{1,64}$/.test(capabilityVersion)) return null;
  return {
    supported: true,
    reason: "trustedFirstPartyBase",
    contractVersion: STUDIO_CONTRACT_VERSION,
    bridgeVersion: STUDIO_BRIDGE_VERSION,
    profileId: profile.profileId,
    sourceRevision: input.sourceRevision,
    repositoryDigest: input.repositoryDigest,
    previewOrigin: new URL(input.previewOrigin).origin,
    adapterVersion,
    capabilityVersion,
    capabilities: expectedCapabilities,
    compileAdmission: {
      available: false,
      reason: "workerIsolationUnavailable",
      message: "Compilation indisponible : le runner n’a pas admis de worker OCI isolé.",
    },
    expectedPaths: profile.expectedPaths,
    surfaces: profile.surfaces,
  };
}

export function isExactStudioOrigin(value: string): boolean {
  try {
    const origin = new URL(value);
    const exactOrigin = origin.protocol === "http:" && origin.hostname === "127.0.0.1" &&
      origin.username === "" && origin.password === "" && origin.pathname === "/" && origin.search === "" && origin.hash === "";
    return exactOrigin && (origin.port === "3002" || origin.port === "3003");
  } catch {
    return false;
  }
}
