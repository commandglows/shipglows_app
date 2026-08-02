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
  readonly supabase: {
    readonly enabled: boolean;
    readonly url?: string;
    readonly jwtAudience: string;
  };
  readonly github: {
    readonly enabled: boolean;
    readonly appId?: string;
    readonly privateKey?: string;
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
  const supabaseEnabled = readBoolean(env["SUPABASE_AUTH_ENABLED"], "SUPABASE_AUTH_ENABLED", issues);
  const githubEnabled = readBoolean(env["GITHUB_ENABLED"], "GITHUB_ENABLED", issues);
  const codexEnabled = readBoolean(env["CODEX_ENABLED"], "CODEX_ENABLED", issues);
  const eveEnabled = readBoolean(env["EVE_ENABLED"], "EVE_ENABLED", issues);
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
    issues.push("CLERK_* is retired; use the Supabase Auth adapter");
  }
  if (supabaseEnabled && !env["SUPABASE_URL"]) {
    issues.push("SUPABASE_URL");
  }
  if (githubEnabled && !/^[1-9][0-9]*$/.test(env["GITHUB_APP_ID"] ?? "")) {
    issues.push("GITHUB_APP_ID");
  }
  if (githubEnabled && !(env["GITHUB_PRIVATE_KEY"] ?? "").includes("BEGIN PRIVATE KEY")) {
    issues.push("GITHUB_PRIVATE_KEY");
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
  if (issues.length > 0) throw new ConfigError(issues);

  return {
    environment: env["RUNNER_ENV"] ?? "test",
    cwd: options.cwd ?? process.cwd(),
    server: { host, port, allowedOrigins },
    limits: { maxConcurrentRunsPerTenant, maxRunDurationMs },
    integrations: {
      supabase: {
        enabled: supabaseEnabled,
        jwtAudience: env["SUPABASE_JWT_AUDIENCE"] ?? "authenticated",
        ...(env["SUPABASE_URL"] ? { url: env["SUPABASE_URL"] } : {}),
      },
      github: {
        enabled: githubEnabled,
        ...(githubEnabled ? {
          appId: env["GITHUB_APP_ID"] ?? "",
          privateKey: (env["GITHUB_PRIVATE_KEY"] ?? "").replace(/\\n/g, "\n"),
          ...(env["GITHUB_API_BASE_URL"] ? { apiBaseUrl: env["GITHUB_API_BASE_URL"] } : {}),
        } : {}),
      },
    },
    runtimes: {
      codex: { enabled: codexEnabled },
      eve: { enabled: eveEnabled },
    },
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
    supabaseEnabled: config.integrations.supabase.enabled,
    githubEnabled: config.integrations.github.enabled,
    codexEnabled: config.runtimes.codex.enabled,
    eveEnabled: config.runtimes.eve.enabled,
  };
}
