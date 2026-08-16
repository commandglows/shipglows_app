import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PreviewRuntimeAdmissionError,
  PreviewRuntimeController,
  type PreviewRuntimeProvider,
} from "../../src/studio/previewRuntimeProvider.js";

describe("PreviewRuntimeProvider lifecycle", () => {
  it("runs the ordered lifecycle and cleanup is idempotent", async () => {
    const calls: string[] = [];
    const provider: PreviewRuntimeProvider = {
      providerId: "fake", capabilities: { basePreview: true, generatedPreview: false, networkDenied: true },
      preflight: async () => { calls.push("preflight"); return { available: true, admissionId: "adm_1" }; },
      start: async () => { calls.push("start"); return { runtimeId: "run_1", origin: "http://127.0.0.1:4321" }; },
      health: async () => { calls.push("health"); return { healthy: true }; },
      interrupt: async () => { calls.push("interrupt"); }, stop: async () => { calls.push("stop"); },
      cleanup: async () => { calls.push("cleanup"); },
    };
    const controller = new PreviewRuntimeController(provider);
    const runtime = await controller.start({ profileId: "shipglows.astro.hero.v1", sourceRevision: "abc123", generated: false });
    assert.equal((await controller.health()).healthy, true);
    await controller.interrupt("operator");
    await controller.stop();
    await controller.cleanup();
    await controller.cleanup();
    assert.equal(runtime.runtimeId, "run_1");
    assert.deepEqual(calls, ["preflight", "start", "health", "interrupt", "stop", "cleanup"]);
  });

  it("fails closed when unavailable or generated preview isolation is absent", async () => {
    const provider: PreviewRuntimeProvider = {
      providerId: "degraded", capabilities: { basePreview: true, generatedPreview: false, networkDenied: true },
      preflight: async () => ({ available: false, reason: "sandboxUnavailable" }),
      start: async () => { throw new Error("must not start"); }, health: async () => ({ healthy: false }),
      interrupt: async () => undefined, stop: async () => undefined, cleanup: async () => undefined,
    };
    await assert.rejects(
      new PreviewRuntimeController(provider).start({ profileId: "shipglows.astro.hero.v1", sourceRevision: "abc123", generated: false }),
      PreviewRuntimeAdmissionError,
    );
    await assert.rejects(
      new PreviewRuntimeController({ ...provider, preflight: async () => ({ available: true, admissionId: "adm_1" }) })
        .start({ profileId: "shipglows.astro.hero.v1", sourceRevision: "abc123", generated: true }),
      /generated preview/i,
    );
  });
});
