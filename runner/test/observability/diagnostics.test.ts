import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBuildIdentity, RunnerDiagnostics } from "../../src/observability/index.js";

describe("runner diagnostics", () => {
  it("emits bounded build identity with UTC and Europe/Paris timestamps", async () => {
    const build = createBuildIdentity({
      RUNNER_BUILD_ID: "build-20260811.1",
      RUNNER_BUILD_COMMIT: "a232292d",
      RUNNER_BUILD_TIMESTAMP: "2026-08-11T16:00:00.000Z",
    });
    const diagnostics = new RunnerDiagnostics({
      build,
      probes: [{ name: "database", check: () => undefined }],
      now: () => new Date("2026-08-11T16:05:00.000Z"),
    });

    assert.deepEqual(await diagnostics.snapshot(), {
      status: "ok",
      build: {
        service: "shipglows-managed-runner",
        version: "0.1.0",
        buildId: "build-20260811.1",
        commit: "a232292d",
        builtAtUtc: "2026-08-11T16:00:00.000Z",
        builtAtParis: "2026-08-11T18:00:00 Europe/Paris",
      },
      generatedAtUtc: "2026-08-11T16:05:00.000Z",
      generatedAtParis: "2026-08-11T18:05:00 Europe/Paris",
      checks: [{ name: "database", status: "ok", code: "available" }],
    });
  });

  it("fails a synthetic probe without reflecting its secret-bearing error", async () => {
    const diagnostics = new RunnerDiagnostics({
      build: createBuildIdentity({
        RUNNER_BUILD_ID: "../../private/path",
        RUNNER_BUILD_COMMIT: "ghp_abcdefghijklmnopqrstuvwxyz012345",
        RUNNER_BUILD_TIMESTAMP: "not-a-date",
      }),
      probes: [{
        name: "database",
        check: () => { throw new Error("token=ghp_abcdefghijklmnopqrstuvwxyz012345 at /srv/private/db.sqlite"); },
      }],
      now: () => new Date("2026-08-11T16:05:00.000Z"),
    });

    const snapshot = await diagnostics.snapshot();
    const serialized = JSON.stringify(snapshot);
    assert.equal(snapshot.status, "degraded");
    assert.equal(snapshot.build.buildId, "unknown");
    assert.equal(snapshot.build.commit, "unknown");
    assert.equal(snapshot.build.builtAtUtc, "unknown");
    assert.doesNotMatch(serialized, /ghp_|\/srv\/|private|token=/i);
    assert.deepEqual(snapshot.checks, [
      { name: "database", status: "failed", code: "dependencyFailure" },
    ]);
  });
});
