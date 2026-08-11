import { assertSecretSafe, type SafePayload } from "../contracts/index.js";

export const HEALTH_DIMENSIONS = ["tech", "content", "seo", "performance", "security"] as const;

export type HealthDimension = (typeof HEALTH_DIMENSIONS)[number];
export type EvidenceHealthStatus = "healthy" | "warning" | "critical" | "unknown";
export type ProjectedHealthStatus = EvidenceHealthStatus | "notReported" | "stale";

export interface HealthEvidenceSignal {
  readonly dimension: HealthDimension;
  readonly status: EvidenceHealthStatus;
  readonly summary: SafePayload;
  readonly producer: string;
  readonly sourceCommit: string;
  readonly observedAt: string;
  readonly skillRunId?: string | null;
  readonly contextBundleId?: string | null;
}

export interface HealthDimensionProjection {
  readonly dimension: HealthDimension;
  readonly status: ProjectedHealthStatus;
  readonly summary: SafePayload;
  readonly producer: string;
  readonly evidenceCount: number;
  readonly sourceCommit: string | null;
  readonly checkedAt: string | null;
  readonly skillRunId: string | null;
  readonly contextBundleId: string | null;
}

export interface ProjectHealthProjection {
  readonly overallStatus: ProjectedHealthStatus;
  readonly coverage: number;
  readonly dimensions: readonly HealthDimensionProjection[];
}

export class HealthEvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HealthEvidenceError";
  }
}

function validateEvidence(signal: HealthEvidenceSignal): number {
  if (!HEALTH_DIMENSIONS.includes(signal.dimension)) {
    throw new HealthEvidenceError("Health evidence dimension is invalid.");
  }
  if (!["healthy", "warning", "critical", "unknown"].includes(signal.status)) {
    throw new HealthEvidenceError("Health evidence status is invalid.");
  }
  if (!/^[A-Za-z0-9._/-]{1,128}$/.test(signal.producer)) {
    throw new HealthEvidenceError("Health evidence producer is invalid.");
  }
  if (!/^[A-Za-z0-9._/-]{1,200}$/.test(signal.sourceCommit)) {
    throw new HealthEvidenceError("Health evidence source commit is invalid.");
  }
  assertSecretSafe(signal.summary);
  const observedAt = Date.parse(signal.observedAt);
  if (!Number.isFinite(observedAt)) {
    throw new HealthEvidenceError("Health evidence observedAt must be an ISO timestamp.");
  }
  return observedAt;
}

const statusRank: Readonly<Record<ProjectedHealthStatus, number>> = {
  unknown: 0,
  notReported: 0,
  healthy: 1,
  stale: 2,
  warning: 3,
  critical: 4,
};

function projectStatus(
  status: EvidenceHealthStatus,
  observedAt: number,
  now: number,
  staleAfterMs: number,
): ProjectedHealthStatus {
  if (status === "unknown") return "unknown";
  if (now - observedAt <= staleAfterMs) return status;
  return statusRank[status] >= statusRank.stale ? status : "stale";
}

export class ShipGlowsHealthEvaluator {
  readonly #staleAfterMs: number;

  constructor({ staleAfterDays = 30 }: { readonly staleAfterDays?: number } = {}) {
    if (!Number.isSafeInteger(staleAfterDays) || staleAfterDays < 1 || staleAfterDays > 365) {
      throw new HealthEvidenceError("Health evidence freshness window is invalid.");
    }
    this.#staleAfterMs = staleAfterDays * 24 * 60 * 60 * 1000;
  }

  evaluate(evidence: readonly HealthEvidenceSignal[], now = new Date()): ProjectHealthProjection {
    const nowMs = now.getTime();
    if (!Number.isFinite(nowMs)) throw new HealthEvidenceError("Health evaluation time is invalid.");

    const validated = evidence.map((signal) => ({ signal, observedAt: validateEvidence(signal) }));
    const dimensions = HEALTH_DIMENSIONS.map((dimension): HealthDimensionProjection => {
      const matching = validated
        .filter((item) => item.signal.dimension === dimension)
        .sort((left, right) => right.observedAt - left.observedAt);
      const latest = matching[0];
      if (latest === undefined) {
        return {
          dimension,
          status: "notReported",
          summary: { text: "No evidence reported." },
          producer: "none",
          evidenceCount: 0,
          sourceCommit: null,
          checkedAt: null,
          skillRunId: null,
          contextBundleId: null,
        };
      }
      return {
        dimension,
        status: projectStatus(latest.signal.status, latest.observedAt, nowMs, this.#staleAfterMs),
        summary: latest.signal.summary,
        producer: latest.signal.producer,
        evidenceCount: matching.length,
        sourceCommit: latest.signal.sourceCommit,
        checkedAt: new Date(latest.observedAt).toISOString(),
        skillRunId: latest.signal.skillRunId ?? null,
        contextBundleId: latest.signal.contextBundleId ?? null,
      };
    });
    const reported = dimensions.filter((item) => item.status !== "unknown" && item.status !== "notReported");
    const overallStatus = reported.reduce<ProjectedHealthStatus>(
      (current, item) => statusRank[item.status] > statusRank[current] ? item.status : current,
      "unknown",
    );
    return {
      overallStatus,
      coverage: reported.length / HEALTH_DIMENSIONS.length,
      dimensions,
    };
  }
}
