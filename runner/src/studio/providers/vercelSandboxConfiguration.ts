export const VERCEL_SANDBOX_SDK_VERSION = "3.0.0" as const;
export const VERCEL_SANDBOX_SDK_INTEGRITY =
  "sha512-1pF3id7LIG2GfjkEAZW+ZngMDdywJw7aFLOyIlry/lj8v3b4GMn3WCuBbvG4N4wTmYUfFzHaVHfdwVpqALEFkw==" as const;
export const ASYNC_RETRY_TYPES_VERSION = "1.4.9" as const;
export const ASYNC_RETRY_TYPES_INTEGRITY =
  "sha512-s1ciZQJzRh3708X/m3vPExr5KJlzlZJvXsKpbtE2luqNcbROr64qU+3KpJsYHqWMeaxI839OvXf9PrUSw1Xtyg==" as const;

export const VERCEL_COMPILATION_LIMITS = Object.freeze({
  timeoutMs: 600_000,
  vcpus: 4,
  memoryBytes: 8_589_934_592,
  diskBytes: 21_474_836_480,
  processes: 256,
  stdoutBytes: 1_048_576,
  stderrBytes: 1_048_576,
  ports: 0,
  persistentBytes: 0,
  snapshotBytes: 0,
  providerApiCalls: 32,
  providerApiWindowMs: 900_000,
  spendEur: "5.000000",
} as const);

export type VercelCompilationTarget = "astro_web" | "flutter_web";

export interface VercelCompilationImageIdentity {
  readonly reference: string;
  readonly imageDigest: string;
  readonly toolchainDigest: string;
}

export interface VercelOidcPolicy {
  readonly issuer: string;
  readonly jwksUrl: string;
  readonly audience: string;
  readonly subject: string;
  readonly owner: string;
  readonly ownerId: string;
  readonly team: string;
  readonly teamId: string;
  readonly project: string;
  readonly projectId: string;
  readonly userId: string;
  readonly environment: "development";
}

export interface VercelSandboxConfiguration {
  readonly enabled: boolean;
  readonly accountScopeDigest?: string;
  readonly projectScopeDigest?: string;
  readonly configurationDigest?: string;
  readonly oidc?: VercelOidcPolicy;
  readonly images?: Readonly<Record<VercelCompilationTarget, VercelCompilationImageIdentity>>;
}

export interface ValidatedVercelSandboxConfiguration {
  readonly enabled: boolean;
  readonly accountScopeDigest: string | null;
  readonly projectScopeDigest: string | null;
  readonly configurationDigest: string | null;
  readonly oidc: Readonly<VercelOidcPolicy> | null;
  readonly images: Readonly<Record<VercelCompilationTarget, Readonly<VercelCompilationImageIdentity>>> | null;
  readonly sdkVersion: typeof VERCEL_SANDBOX_SDK_VERSION;
  readonly limits: typeof VERCEL_COMPILATION_LIMITS;
}

export class VercelSandboxConfigurationError extends Error {
  constructor() {
    super("Vercel Sandbox compilation is unavailable.");
    this.name = "VercelSandboxConfigurationError";
  }
}

const DIGEST = /^[a-f0-9]{64}$/;
const CLAIM = /^[\x21-\x7e]{1,256}$/;
const ID = /^[a-zA-Z0-9_-]{1,128}$/;
const IMMUTABLE_VCR_IMAGE = /^(?:vcr\.vercel\.com\/)?[a-z0-9][a-z0-9._/-]*[a-z0-9]@sha256:([a-f0-9]{64})$/;
const CONFIG_KEYS = new Set(["enabled", "accountScopeDigest", "projectScopeDigest", "configurationDigest", "oidc", "images"]);
const OIDC_KEYS = new Set(["issuer", "jwksUrl", "audience", "subject", "owner", "ownerId", "team", "teamId", "project", "projectId", "userId", "environment"]);
const IMAGE_KEYS = new Set(["reference", "imageDigest", "toolchainDigest"]);

export function validateVercelSandboxConfiguration(input: VercelSandboxConfiguration): ValidatedVercelSandboxConfiguration {
  if (typeof input.enabled !== "boolean") throw new VercelSandboxConfigurationError();
  if (!input.enabled) {
    if (Object.keys(input).length !== 1) throw new VercelSandboxConfigurationError();
    return Object.freeze({ enabled: false, accountScopeDigest: null, projectScopeDigest: null, configurationDigest: null, oidc: null, images: null, sdkVersion: VERCEL_SANDBOX_SDK_VERSION, limits: VERCEL_COMPILATION_LIMITS });
  }

  if (!exactKeys(input, CONFIG_KEYS)) throw new VercelSandboxConfigurationError();

  if (!DIGEST.test(input.accountScopeDigest ?? "") || !DIGEST.test(input.projectScopeDigest ?? "") || !DIGEST.test(input.configurationDigest ?? "")) throw new VercelSandboxConfigurationError();
  const oidc = validateOidc(input.oidc);
  const images = input.images;
  if (images === undefined || Object.keys(images).length !== 2 || !Object.hasOwn(images, "astro_web") || !Object.hasOwn(images, "flutter_web")) throw new VercelSandboxConfigurationError();
  const astro = validateImage(images.astro_web);
  const flutter = validateImage(images.flutter_web);
  if (astro.reference === flutter.reference || astro.imageDigest === flutter.imageDigest || astro.toolchainDigest === flutter.toolchainDigest) throw new VercelSandboxConfigurationError();

  return Object.freeze({
    enabled: true,
    accountScopeDigest: input.accountScopeDigest ?? null,
    projectScopeDigest: input.projectScopeDigest ?? null,
    configurationDigest: input.configurationDigest ?? null,
    oidc,
    images: Object.freeze({ astro_web: astro, flutter_web: flutter }),
    sdkVersion: VERCEL_SANDBOX_SDK_VERSION,
    limits: VERCEL_COMPILATION_LIMITS,
  });
}

export function disabledVercelSandboxConfiguration(): ValidatedVercelSandboxConfiguration {
  return validateVercelSandboxConfiguration({ enabled: false });
}

function validateOidc(value: VercelOidcPolicy | undefined): Readonly<VercelOidcPolicy> {
  const environment: unknown = value?.environment;
  if (value === undefined || !exactKeys(value, OIDC_KEYS) || environment !== "development") throw new VercelSandboxConfigurationError();
  let issuer: URL; let jwks: URL;
  try { issuer = new URL(value.issuer); jwks = new URL(value.jwksUrl); } catch { throw new VercelSandboxConfigurationError(); }
  if (issuer.protocol !== "https:" || issuer.username !== "" || issuer.password !== "" || issuer.search !== "" || issuer.hash !== "" || issuer.origin !== jwks.origin || jwks.protocol !== "https:" || jwks.username !== "" || jwks.password !== "" || jwks.search !== "" || jwks.hash !== "" || !jwks.pathname.startsWith(`${issuer.pathname.replace(/\/$/, "")}/`)) throw new VercelSandboxConfigurationError();
  if (![value.audience, value.subject, value.owner, value.team, value.project].every((item) => CLAIM.test(item)) || ![value.ownerId, value.teamId, value.projectId, value.userId].every((item) => ID.test(item))) throw new VercelSandboxConfigurationError();
  return Object.freeze({ ...value });
}

function validateImage(value: VercelCompilationImageIdentity): Readonly<VercelCompilationImageIdentity> {
  if (!exactKeys(value, IMAGE_KEYS) || !DIGEST.test(value.imageDigest) || !DIGEST.test(value.toolchainDigest)) throw new VercelSandboxConfigurationError();
  const match = IMMUTABLE_VCR_IMAGE.exec(value.reference);
  if (match?.[1] !== value.imageDigest) throw new VercelSandboxConfigurationError();
  return Object.freeze({ ...value });
}

function exactKeys(value: object, allowed: ReadonlySet<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.size && keys.every((key) => allowed.has(key));
}
