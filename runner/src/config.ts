import { isAbsolute, resolve } from "node:path";

import { studioProfileForProject, type StudioProjectId } from "./studio/profiles.js";

export class ConfigError extends Error {
  readonly code = "invalidConfig";

  constructor(readonly issues: readonly string[]) {
    super(`Invalid runner configuration: ${issues.join(", ")}`);
    this.name = "ConfigError";
  }
}

export interface RunnerConfig {
  readonly environment: string;
  readonly cwd: string;
  readonly server: RunnerServerConfig;
  readonly limits: RunnerLimitsConfig;
  readonly integrations: RunnerIntegrationsConfig;
  readonly runtimes: RunnerRuntimesConfig;
  readonly operatorWorkspaces: Readonly<Record<string, OperatorWorkspaceConfig>>;
  readonly studio: RunnerStudioConfig;
  readonly localStudioAuthEnabled: boolean;
}

export type RunnerStudioConfig =
  | { readonly enabled: false }
  | {
      readonly enabled: true;
      readonly projectId: StudioProjectId;
      readonly previewOrigin: "http://127.0.0.1:3002" | "http://127.0.0.1:3003";
      readonly repositoryRoot: string;
      readonly repositoryCleanScope: "site";
      readonly expectedSourceRevision: string;
      readonly expectedRepositoryDigest: string;
      readonly adapterVersion: string;
      readonly capabilityVersion: string;
    };

export interface OperatorWorkspaceConfig {
  readonly cwd: string;
  readonly tmuxSession: string;
}

function parseOperatorWorkspaces(value: string | undefined, issues: string[]): Record<string, OperatorWorkspaceConfig> {
  if (value === undefined || value.trim() === "") return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    const result: Record<string, OperatorWorkspaceConfig> = {};
    for (const [projectId, entry] of Object.entries(parsed)) {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId) || entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new Error();
      const { cwd, tmuxSession } = entry as Record<string, unknown>;
      if (typeof cwd !== "string" || !cwd.startsWith("/") || typeof tmuxSession !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(tmuxSession)) throw new Error();
      result[projectId] = { cwd, tmuxSession };
    }
    return result;
  } catch {
    issues.push("RUNNER_OPERATOR_WORKSPACES must be a JSON project map with absolute cwd and allowlisted tmuxSession");
    return {};
  }
}

export interface RunnerLimitsConfig {
  readonly maxConcurrentRunsPerTenant: number;
  readonly maxRunDurationMs: number;
}

export interface RunnerServerConfig {
  readonly host: string;
  readonly port: number;
  readonly allowedOrigins: readonly string[];
}

export interface RunnerIntegrationsConfig {
  readonly firebase: {
    readonly enabled: boolean;
    readonly projectId?: string;
  };
  readonly github: {
    readonly enabled: boolean;
    readonly appId?: string;
    readonly appSlug?: string;
    readonly privateKey?: string;
    readonly setupUrl?: string;
    readonly apiBaseUrl?: string;
  };
}

export interface RunnerRuntimesConfig {
  readonly codex: { readonly enabled: boolean };
  readonly eve: { readonly enabled: boolean };
}

function readBoolean(
  value: string | undefined,
  name: string,
  issues: string[],
): boolean {
  if (value === undefined || value === "false") return false;
  if (value === "true") return true;
  issues.push(`${name} must be true or false`);
  return false;
}

function readBoundedInteger(
  value: string | undefined,
  fallback: number,
  name: string,
  minimum: number,
  maximum: number,
  issues: string[],
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    issues.push(`${name} must be an integer between ${minimum} and ${maximum}`);
    return fallback;
  }
  return parsed;
}

function parseAllowedOrigins(value: string | undefined, issues: string[]): string[] {
  if (value === undefined || value.trim() === "") return [];

  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
  const normalized: string[] = [];
  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        issues.push("RUNNER_ALLOWED_ORIGINS contains an unsupported scheme");
      } else {
        normalized.push(parsed.origin);
      }
    } catch {
      issues.push("RUNNER_ALLOWED_ORIGINS contains an invalid origin");
    }
  }
  return [...new Set(normalized)];
}

export function loadConfig(
  env: Record<string, string | undefined> = process.env,
  options: { cwd?: string } = {},
): RunnerConfig {
  const issues: string[] = [];
  const port = Number(env["RUNNER_PORT"] ?? 3210);
  const host = env["RUNNER_HOST"] ?? "127.0.0.1";
  const firebaseEnabled = readBoolean(env["FIREBASE_AUTH_ENABLED"], "FIREBASE_AUTH_ENABLED", issues);
  const githubEnabled = readBoolean(env["GITHUB_ENABLED"], "GITHUB_ENABLED", issues);
  const codexEnabled = readBoolean(env["CODEX_ENABLED"], "CODEX_ENABLED", issues);
  const eveEnabled = readBoolean(env["EVE_ENABLED"], "EVE_ENABLED", issues);
  const studioEnabled = readBoolean(env["RUNNER_STUDIO_ENABLED"], "RUNNER_STUDIO_ENABLED", issues);
  const localStudioAuthEnabled = readBoolean(env["RUNNER_LOCAL_STUDIO_AUTH_ENABLED"], "RUNNER_LOCAL_STUDIO_AUTH_ENABLED", issues);
  const operatorWorkspaces = parseOperatorWorkspaces(env["RUNNER_OPERATOR_WORKSPACES"], issues);
  const maxConcurrentRunsPerTenant = readBoundedInteger(
    env["RUNNER_MAX_CONCURRENT_RUNS_PER_TENANT"],
    2,
    "RUNNER_MAX_CONCURRENT_RUNS_PER_TENANT",
    1,
    32,
    issues,
  );
  const maxRunDurationMs = readBoundedInteger(
    env["RUNNER_MAX_RUN_DURATION_MS"],
    15 * 60 * 1000,
    "RUNNER_MAX_RUN_DURATION_MS",
    1_000,
    24 * 60 * 60 * 1000,
    issues,
  );

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    issues.push("RUNNER_PORT must be a valid TCP port");
  }
  if (env["RUNNER_UNSAFE_SHELL"] !== undefined) issues.push("RUNNER_UNSAFE_SHELL");
  if (env["RUNNER_PUBLIC_APP_SERVER"] !== undefined) issues.push("RUNNER_PUBLIC_APP_SERVER");
  if (env["RUNNER_ALLOW_CLIENT_PATHS"] !== undefined) issues.push("RUNNER_ALLOW_CLIENT_PATHS");
  if (env["CLERK_ENABLED"] !== undefined || env["CLERK_SECRET_KEY"] !== undefined) {
    issues.push("CLERK_* is retired; use the Firebase Auth adapter");
  }
  if (env["SUPABASE_AUTH_ENABLED"] !== undefined || env["SUPABASE_URL"] !== undefined || env["SUPABASE_JWT_AUDIENCE"] !== undefined) {
    issues.push("SUPABASE_* is retired; use FIREBASE_AUTH_ENABLED and FIREBASE_PROJECT_ID");
  }
  if (firebaseEnabled && !env["FIREBASE_PROJECT_ID"]) {
    issues.push("FIREBASE_PROJECT_ID");
  }
  if (githubEnabled && !/^[1-9][0-9]*$/.test(env["GITHUB_APP_ID"] ?? "")) {
    issues.push("GITHUB_APP_ID");
  }
  if (githubEnabled && localStudioAuthEnabled && !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,98}[A-Za-z0-9])?$/.test(env["GITHUB_APP_SLUG"] ?? "")) {
    issues.push("GITHUB_APP_SLUG");
  }
  if (githubEnabled && !(env["GITHUB_PRIVATE_KEY"] ?? "").includes("BEGIN PRIVATE KEY")) {
    issues.push("GITHUB_PRIVATE_KEY");
  }
  if (githubEnabled && localStudioAuthEnabled) {
    try {
      const setupUrl = new URL(env["GITHUB_APP_SETUP_URL"] ?? "");
      const localHttp = setupUrl.protocol === "http:" && (setupUrl.hostname === "127.0.0.1" || setupUrl.hostname === "[::1]");
      if ((setupUrl.protocol !== "https:" && setupUrl.protocol !== "shipglows:" && !localHttp) ||
          setupUrl.username !== "" || setupUrl.password !== "" || setupUrl.hash !== "") {
        issues.push("GITHUB_APP_SETUP_URL must use HTTPS, the ShipGlows scheme, or loopback HTTP without credentials or a fragment");
      }
    } catch {
      issues.push("GITHUB_APP_SETUP_URL must be a valid setup return URL");
    }
  }
  if (env["GITHUB_TOKEN"] !== undefined) {
    issues.push("GITHUB_TOKEN is unsupported; configure a GitHub App instead");
  }
  if (env["GITHUB_API_BASE_URL"] !== undefined) {
    try {
      if (new URL(env["GITHUB_API_BASE_URL"]).protocol !== "https:") {
        issues.push("GITHUB_API_BASE_URL must use HTTPS");
      }
    } catch {
      issues.push("GITHUB_API_BASE_URL must be a valid URL");
    }
  }
  if (host !== "127.0.0.1" && host !== "::1" && env["RUNNER_ALLOW_PUBLIC_BINDING"] !== "true") {
    issues.push("RUNNER_ALLOW_PUBLIC_BINDING=true is required for a non-loopback host");
  }

  const allowedOrigins = parseAllowedOrigins(env["RUNNER_ALLOWED_ORIGINS"], issues);
  const environment = env["RUNNER_ENV"] ?? "test";
  const configuredStudioProfile = studioProfileForProject(env["RUNNER_STUDIO_PROJECT_ID"] ?? "");
  if (studioEnabled && environment === "production") issues.push("RUNNER_STUDIO_ENABLED is forbidden in production");
  if (studioEnabled && configuredStudioProfile === null) issues.push("RUNNER_STUDIO_PROJECT_ID must select a supported Studio profile");
  if (studioEnabled && configuredStudioProfile !== null && env["RUNNER_STUDIO_ORIGIN"] !== configuredStudioProfile.previewOrigin) issues.push(`RUNNER_STUDIO_ORIGIN must be ${configuredStudioProfile.previewOrigin}`);
  if (studioEnabled && configuredStudioProfile?.projectId === "gocharbon" && !isAbsolute(env["RUNNER_STUDIO_REPOSITORY_ROOT"] ?? "")) issues.push("RUNNER_STUDIO_REPOSITORY_ROOT must be an absolute path for gocharbon");
  if (studioEnabled && configuredStudioProfile?.projectId === "shipglows_app" && env["RUNNER_STUDIO_REPOSITORY_ROOT"] !== undefined) issues.push("RUNNER_STUDIO_REPOSITORY_ROOT is not configurable for shipglows_app");
  if (studioEnabled && !/^[a-f0-9]{7,64}$/i.test(env["RUNNER_STUDIO_SOURCE_REVISION"] ?? "")) issues.push("RUNNER_STUDIO_SOURCE_REVISION must be an exact Git revision");
  if (studioEnabled && !/^[a-f0-9]{64}$/i.test(env["RUNNER_STUDIO_REPOSITORY_DIGEST"] ?? "")) issues.push("RUNNER_STUDIO_REPOSITORY_DIGEST must be a SHA-256 digest");
  if (studioEnabled && !/^[A-Za-z0-9._-]{1,64}$/.test(env["RUNNER_STUDIO_ADAPTER_VERSION"] ?? "")) issues.push("RUNNER_STUDIO_ADAPTER_VERSION is required");
  if (studioEnabled && !/^[A-Za-z0-9._-]{1,64}$/.test(env["RUNNER_STUDIO_CAPABILITY_VERSION"] ?? "")) issues.push("RUNNER_STUDIO_CAPABILITY_VERSION is required");
  if (localStudioAuthEnabled && environment !== "development") issues.push("RUNNER_LOCAL_STUDIO_AUTH_ENABLED is development-only");
  if (localStudioAuthEnabled && host !== "127.0.0.1" && host !== "::1") issues.push("RUNNER_LOCAL_STUDIO_AUTH_ENABLED requires a loopback host");
  if (localStudioAuthEnabled && !studioEnabled) issues.push("RUNNER_LOCAL_STUDIO_AUTH_ENABLED requires RUNNER_STUDIO_ENABLED=true");
  if (localStudioAuthEnabled && firebaseEnabled) issues.push("RUNNER_LOCAL_STUDIO_AUTH_ENABLED cannot be combined with Firebase authentication");
  if (localStudioAuthEnabled && (allowedOrigins.length !== 1 || allowedOrigins[0] !== "http://127.0.0.1:3005")) issues.push("RUNNER_LOCAL_STUDIO_AUTH_ENABLED requires the exact local app origin");
  if (environment === "production" && !firebaseEnabled) {
    issues.push("FIREBASE_AUTH_ENABLED=true is required in production");
  }
  if (environment === "production" && allowedOrigins.length === 0) {
    issues.push("RUNNER_ALLOWED_ORIGINS is required in production");
  }
  if (issues.length > 0) throw new ConfigError(issues);

  return {
    environment,
    cwd: options.cwd ?? process.cwd(),
    server: { host, port, allowedOrigins },
    limits: { maxConcurrentRunsPerTenant, maxRunDurationMs },
    integrations: {
      firebase: {
        enabled: firebaseEnabled,
        ...(env["FIREBASE_PROJECT_ID"] ? { projectId: env["FIREBASE_PROJECT_ID"] } : {}),
      },
      github: {
        enabled: githubEnabled,
        ...(githubEnabled ? {
          appId: env["GITHUB_APP_ID"] ?? "",
          privateKey: (env["GITHUB_PRIVATE_KEY"] ?? "").replace(/\\n/g, "\n"),
          ...(localStudioAuthEnabled ? {
            appSlug: env["GITHUB_APP_SLUG"] ?? "",
            setupUrl: env["GITHUB_APP_SETUP_URL"] ?? "",
          } : {}),
          ...(env["GITHUB_API_BASE_URL"] ? { apiBaseUrl: env["GITHUB_API_BASE_URL"] } : {}),
        } : {}),
      },
    },
    runtimes: {
      codex: { enabled: codexEnabled },
      eve: { enabled: eveEnabled },
    },
    operatorWorkspaces,
    localStudioAuthEnabled,
    studio: studioEnabled && configuredStudioProfile !== null ? {
      enabled: true,
      projectId: configuredStudioProfile.projectId,
      previewOrigin: configuredStudioProfile.previewOrigin,
      repositoryRoot: configuredStudioProfile.projectId === "gocharbon"
        ? env["RUNNER_STUDIO_REPOSITORY_ROOT"] ?? ""
        : resolve(options.cwd ?? process.cwd(), ".."),
      repositoryCleanScope: "site",
      expectedSourceRevision: env["RUNNER_STUDIO_SOURCE_REVISION"] ?? "",
      expectedRepositoryDigest: env["RUNNER_STUDIO_REPOSITORY_DIGEST"] ?? "",
      adapterVersion: env["RUNNER_STUDIO_ADAPTER_VERSION"] ?? "",
      capabilityVersion: env["RUNNER_STUDIO_CAPABILITY_VERSION"] ?? "",
    } : { enabled: false },
  };
}

export function publicConfig(config: RunnerConfig) {
  return {
    environment: config.environment,
    host: config.server.host,
    port: config.server.port,
    allowedOrigins: config.server.allowedOrigins,
    maxConcurrentRunsPerTenant: config.limits.maxConcurrentRunsPerTenant,
    maxRunDurationMs: config.limits.maxRunDurationMs,
    firebaseEnabled: config.integrations.firebase.enabled,
    githubEnabled: config.integrations.github.enabled,
    codexEnabled: config.runtimes.codex.enabled,
    eveEnabled: config.runtimes.eve.enabled,
    operatorWorkspaceCount: Object.keys(config.operatorWorkspaces).length,
    studioEnabled: config.studio.enabled,
    localStudioAuthEnabled: config.localStudioAuthEnabled,
  };
}
