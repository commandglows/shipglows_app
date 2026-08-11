import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HealthEvidenceError,
  ShipGlowsHealthEvaluator,
  type HealthEvidenceSignal,
} from "../../src/health/index.js";

function evidence(
  overrides: Partial<HealthEvidenceSignal> = {},
): HealthEvidenceSignal {
  return {
    dimension: "tech",
    status: "healthy",
    summary: { text: "Checks pass." },
    producer: "shipglows.test",
    sourceCommit: "abc123",
    observedAt: "2026-08-10T08:00:00.000Z",
    ...overrides,
  };
}

describe("ShipGlows health evaluator", () => {
  const now = new Date("2026-08-11T08:00:00.000Z");

  it("keeps all five dimensions explicit without fabricating healthy evidence", () => {
    const projection = new ShipGlowsHealthEvaluator().evaluate([], now);

    assert.equal(projection.dimensions.length, 5);
    assert.equal(projection.overallStatus, "unknown");
    assert.equal(projection.coverage, 0);
    assert.ok(projection.dimensions.every((item) => item.status === "notReported"));
    assert.ok(projection.dimensions.every((item) => item.evidenceCount === 0));
  });

  it("uses the latest evidence per dimension and computes the worst reported state", () => {
    const projection = new ShipGlowsHealthEvaluator().evaluate([
      evidence({ observedAt: "2026-08-09T08:00:00.000Z", summary: { text: "Old result." } }),
      evidence({ observedAt: "2026-08-10T08:00:00.000Z", summary: { text: "Current result." } }),
      evidence({
        dimension: "security",
        status: "critical",
        summary: { text: "Credential exposure detected." },
      }),
    ], now);

    assert.equal(projection.overallStatus, "critical");
    assert.equal(projection.coverage, 0.4);
    assert.deepEqual(projection.dimensions.find((item) => item.dimension === "tech"), {
      dimension: "tech",
      status: "healthy",
      summary: { text: "Current result." },
      producer: "shipglows.test",
      evidenceCount: 2,
      sourceCommit: "abc123",
      checkedAt: "2026-08-10T08:00:00.000Z",
    });
  });

  it("marks expired healthy evidence stale without downgrading an old critical finding", () => {
    const projection = new ShipGlowsHealthEvaluator({ staleAfterDays: 30 }).evaluate([
      evidence({ observedAt: "2026-06-01T08:00:00.000Z" }),
      evidence({
        dimension: "security",
        status: "critical",
        observedAt: "2026-06-01T08:00:00.000Z",
      }),
    ], now);

    assert.equal(
      projection.dimensions.find((item) => item.dimension === "tech")?.status,
      "stale",
    );
    assert.equal(
      projection.dimensions.find((item) => item.dimension === "security")?.status,
      "critical",
    );
    assert.equal(projection.overallStatus, "critical");
  });

  it("fails closed for malformed or secret-bearing evidence", () => {
    const evaluator = new ShipGlowsHealthEvaluator();
    assert.throws(
      () => evaluator.evaluate([evidence({ observedAt: "not-a-date" })], now),
      HealthEvidenceError,
    );
    assert.throws(
      () => evaluator.evaluate([evidence({ summary: { authorization: "Bearer secret" } })], now),
      /restricted secret/i,
    );
  });
});
