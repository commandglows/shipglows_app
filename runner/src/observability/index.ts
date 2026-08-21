import { assertSecretSafe } from "../contracts/index.js";
import * as Sentry from "@sentry/node";

const SERVICE_NAME = "shipglows-managed-runner";
const SERVICE_VERSION = "0.1.0";
const MAX_PROBES = 16;
const SENTRY_EVENT_MESSAGE = "shipglows.runner.httpRequestFailed";

export interface RunnerErrorReporter {
  capture(code: "httpRequestFailed"): void;
}

export interface SentrySdk {
  init(options: Parameters<typeof Sentry.init>[0]): void;
  captureMessage(message: string, level: "error"): unknown;
}

export function scrubSentryEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  return {
    type: undefined,
    ...(typeof event.event_id === "string" ? { event_id: event.event_id } : {}),
    ...(typeof event.timestamp === "number" ? { timestamp: event.timestamp } : {}),
    ...(typeof event.release === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(event.release) ? { release: event.release } : {}),
    ...(typeof event.environment === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(event.environment) ? { environment: event.environment } : {}),
    level: "error",
    platform: "node",
    message: event.message === SENTRY_EVENT_MESSAGE ? SENTRY_EVENT_MESSAGE : "shipglows.runner.failure",
  };
}

export function createSentryErrorReporter(
  config: { readonly enabled: false } | { readonly enabled: true; readonly dsn: string; readonly release: string },
  environment: string,
  sdk: SentrySdk = Sentry,
): RunnerErrorReporter {
  if (!config.enabled) return { capture: () => undefined };
  sdk.init({
    dsn: config.dsn,
    release: config.release,
    environment: /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(environment) ? environment : "unknown",
    defaultIntegrations: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: false, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    beforeSend: scrubSentryEvent,
  });
  return {
    capture: () => {
      try {
        sdk.captureMessage(SENTRY_EVENT_MESSAGE, "error");
      } catch {
        // Observability must never make the managed request path fail.
      }
    },
  };
}

export type DiagnosticStatus = "ok" | "degraded";

export interface HealthProbe {
  readonly name: string;
  check(): void | Promise<void>;
}
export interface BuildIdentity {
  readonly service: typeof SERVICE_NAME;
  readonly version: typeof SERVICE_VERSION;
  readonly buildId: string;
  readonly commit: string;
  readonly builtAtUtc: string;
  readonly builtAtParis: string;
}

export interface DiagnosticSnapshot {
  readonly status: DiagnosticStatus;
  readonly build: BuildIdentity;
  readonly generatedAtUtc: string;
  readonly generatedAtParis: string;
  readonly checks: readonly {
    readonly name: string;
    readonly status: "ok" | "failed";
    readonly code: "available" | "dependencyFailure";
  }[];
}

function safeOpaque(value: string | undefined, pattern: RegExp): string {
  if (value === undefined || !pattern.test(value)) return "unknown";
  return value.slice(0, 128);
}

function parisTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value["year"]}-${value["month"]}-${value["day"]}T${value["hour"]}:${value["minute"]}:${value["second"]} Europe/Paris`;
}

function buildTimestamp(value: string | undefined): { readonly utc: string; readonly paris: string } {
  if (value === undefined) return { utc: "unknown", paris: "unknown" };
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return { utc: "unknown", paris: "unknown" };
  return { utc: parsed.toISOString(), paris: parisTimestamp(parsed) };
}

export function createBuildIdentity(
  env: Readonly<Record<string, string | undefined>> = process.env,
): BuildIdentity {
  const timestamp = buildTimestamp(env["RUNNER_BUILD_TIMESTAMP"]);
  const identity = {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    buildId: safeOpaque(env["RUNNER_BUILD_ID"], /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/),
    commit: safeOpaque(env["RUNNER_BUILD_COMMIT"], /^[a-fA-F0-9]{7,64}$/),
    builtAtUtc: timestamp.utc,
    builtAtParis: timestamp.paris,
  } as const;
  assertSecretSafe(identity);
  return identity;
}

export class RunnerDiagnostics {
  readonly #build: BuildIdentity;
  readonly #probes: readonly HealthProbe[];
  readonly #now: () => Date;

  constructor(input: {
    readonly build?: BuildIdentity;
    readonly probes?: readonly HealthProbe[];
    readonly now?: () => Date;
  } = {}) {
    const probes = input.probes ?? [];
    if (probes.length > MAX_PROBES) throw new Error("Too many diagnostic probes.");
    if (new Set(probes.map((probe) => probe.name)).size !== probes.length) {
      throw new Error("Diagnostic probe names must be unique.");
    }
    for (const probe of probes) {
      if (!/^[a-z][a-zA-Z0-9]{0,31}$/.test(probe.name)) {
        throw new Error("Diagnostic probe name is invalid.");
      }
    }
    this.#build = input.build ?? createBuildIdentity();
    this.#probes = [...probes];
    this.#now = input.now ?? (() => new Date());
  }

  async snapshot(): Promise<DiagnosticSnapshot> {
    const checks = await Promise.all(this.#probes.map(async (probe) => {
      try {
        await probe.check();
        return { name: probe.name, status: "ok" as const, code: "available" as const };
      } catch {
        return { name: probe.name, status: "failed" as const, code: "dependencyFailure" as const };
      }
    }));
    const generatedAt = this.#now();
    if (!Number.isFinite(generatedAt.getTime())) throw new Error("Diagnostic clock returned an invalid timestamp.");
    const snapshot: DiagnosticSnapshot = {
      status: checks.some((check) => check.status === "failed") ? "degraded" : "ok",
      build: this.#build,
      generatedAtUtc: generatedAt.toISOString(),
      generatedAtParis: parisTimestamp(generatedAt),
      checks,
    };
    assertSecretSafe(snapshot);
    return snapshot;
  }
}
