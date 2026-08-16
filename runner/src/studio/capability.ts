import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { STUDIO_CONTRACT_VERSION, isStudioDigest, isStudioRevision, type StudioCapability, type StudioDimension } from "./contracts.js";

export const STUDIO_BRIDGE_VERSION = "shipglows.studio.bridge.v1" as const;
export const STUDIO_PROFILE_ID = "shipglows.astro.hero.v1" as const;
export const STUDIO_PROJECT_ID = "shipglows_app" as const;

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

export const STUDIO_SURFACES = Object.freeze([
  surface("hero.root", "Hero", "Hero", ["token.set", "spacing.set", "radius.set"]),
  surface("hero.copy", "Hero copy", "Hero.copy", ["spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.eyebrow", "Eyebrow", "Hero.eyebrow", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.title", "Title", "Hero.title", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.body", "Body", "Hero.body", ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.points", "Proof points", "Hero.points", ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.actions", "Actions", "Hero.actions", ["spacing.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
  surface("hero.panel", "Product panel", "Hero.panel", ["token.set", "spacing.set", "radius.set", "opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]),
]);

export interface StudioCapabilityProjection {
  readonly supported: true;
  readonly reason: "trustedFirstPartyBase";
  readonly contractVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly bridgeVersion: typeof STUDIO_BRIDGE_VERSION;
  readonly profileId: typeof STUDIO_PROFILE_ID;
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
  readonly expectedPaths: readonly ["site/src/components/Hero.astro"];
  readonly surfaces: typeof STUDIO_SURFACES;
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
  attest(input: { readonly previewOrigin: string; readonly sourceRevision: string; readonly repositoryDigest: string }): Promise<{ readonly healthy: boolean; readonly profileId: string; readonly bridgeVersion: string } | null>;
}

export interface TrustedBaseStudioConfiguration {
  readonly projectId: typeof STUDIO_PROJECT_ID;
  readonly previewOrigin: string;
  readonly expectedSourceRevision: string;
  readonly expectedRepositoryDigest: string;
  readonly adapterVersion: string;
  readonly capabilityVersion: string;
}

const execFileAsync = promisify(execFile);

export class GitStudioRepositoryAttestor implements StudioRepositoryAttestor {
  constructor(private readonly projectRoot: string) {}

  async attest(input: { readonly expectedSourceRevision: string; readonly expectedRepositoryDigest: string }): Promise<{ readonly sourceRevision: string; readonly repositoryDigest: string } | null> {
    if (!isStudioRevision(input.expectedSourceRevision) || !isStudioDigest(input.expectedRepositoryDigest)) return null;
    try {
      const sourceRevision = (await this.git(["rev-parse", "--verify", "HEAD"])).trim();
      if (sourceRevision !== input.expectedSourceRevision) return null;
      const dirty = (await this.git(["status", "--porcelain=v1", "--untracked-files=normal"])).trim();
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

  async attest(input: { readonly previewOrigin: string; readonly sourceRevision: string; readonly repositoryDigest: string }): Promise<{ readonly healthy: true; readonly profileId: typeof STUDIO_PROFILE_ID; readonly bridgeVersion: typeof STUDIO_BRIDGE_VERSION } | null> {
    if (!isExactStudioOrigin(input.previewOrigin)) return null;
    try {
      const response = await fetch(input.previewOrigin, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: { accept: "text/html" },
      });
      if (!response.ok || new URL(response.url).origin !== input.previewOrigin) return null;
      const document = await readBoundedBody(response, 256 * 1024);
      if (!document.includes(`data-sg-studio-profile=\"${STUDIO_PROFILE_ID}\"`) || STUDIO_SURFACES.some((surface) => !document.includes(`data-sg-studio-anchor=\"${surface.id}\"`))) return null;
      const bridgeUrl = new URL("/src/studio/heroContract.ts", input.previewOrigin);
      const bridgeResponse = await fetch(bridgeUrl, { method: "GET", redirect: "error", signal: AbortSignal.timeout(this.timeoutMs), headers: { accept: "text/javascript" } });
      if (!bridgeResponse.ok || new URL(bridgeResponse.url).origin !== input.previewOrigin) return null;
      const bridge = await readBoundedBody(bridgeResponse, 64 * 1024);
      if (!bridge.includes(STUDIO_PROFILE_ID) || !bridge.includes(STUDIO_BRIDGE_VERSION) || STUDIO_SURFACES.some((surface) => !bridge.includes(`\"${surface.id}\"`))) return null;
      return { healthy: true, profileId: STUDIO_PROFILE_ID, bridgeVersion: STUDIO_BRIDGE_VERSION };
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
    if (actor.projectId !== STUDIO_PROJECT_ID) return null;
    const repository = await input.repository.attest({
      expectedSourceRevision: configuration.expectedSourceRevision,
      expectedRepositoryDigest: configuration.expectedRepositoryDigest,
    });
    if (repository === null) return null;
    const runtime = await input.runtime.attest({
      previewOrigin: configuration.previewOrigin,
      sourceRevision: repository.sourceRevision,
      repositoryDigest: repository.repositoryDigest,
    });
    if (runtime?.healthy !== true || runtime.profileId !== STUDIO_PROFILE_ID || runtime.bridgeVersion !== STUDIO_BRIDGE_VERSION) return null;
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
      allowedImpactPaths: ["site/src/components/Hero.astro"],
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
  if (!isExactStudioOrigin(input.previewOrigin)) return null;
  const exactProfile = input.projectId === STUDIO_PROJECT_ID &&
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
    profileId: STUDIO_PROFILE_ID,
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
    expectedPaths: ["site/src/components/Hero.astro"],
    surfaces: STUDIO_SURFACES,
  };
}

export function isExactStudioOrigin(value: string): boolean {
  try {
    const origin = new URL(value);
    return origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.port === "3003" &&
      origin.username === "" && origin.password === "" && origin.pathname === "/" && origin.search === "" && origin.hash === "";
  } catch {
    return false;
  }
}
