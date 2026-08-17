import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PreviewRuntimeAdmissionError, PreviewRuntimeController, type PreviewRuntimeProvider, type PreviewRuntimeRequest } from "../../src/studio/previewRuntimeProvider.js";

const digest = "a".repeat(64);
const request: PreviewRuntimeRequest = { profileId: "shipglows.astro.hero.v1", sourceRevision: "abc1234", repositoryDigest: digest, generated: false };

function provider(overrides: Partial<PreviewRuntimeProvider> = {}): PreviewRuntimeProvider {
  return {
    providerId: "fake",
    capabilities: { basePreview: true, generatedPreview: false, networkDenied: true, hostExecutionDenied: true },
    preflight: async (input) => ({ available: true, admissionId: "adm_1", sourceRevision: input.sourceRevision, repositoryDigest: input.repositoryDigest }),
    start: async (input) => ({ runtimeId: "run_1", origin: "http://127.0.0.1:3003", sourceRevision: input.sourceRevision, repositoryDigest: input.repositoryDigest }),
    health: async () => ({ healthy: true, sourceRevision: request.sourceRevision, repositoryDigest: request.repositoryDigest }),
    interrupt: async () => undefined,
    stop: async () => undefined,
    cleanup: async () => undefined,
    ...overrides,
  };
}

describe("PreviewRuntimeProvider lifecycle", () => {
  it("attests the ordered lifecycle and cleanup is idempotent", async () => {
    const calls: string[] = [];
    const base = provider();
    const runtimeProvider = provider({
      preflight: async (input) => { calls.push("preflight"); return base.preflight(input); },
      start: async (input) => { calls.push("start"); return base.start(input); },
      health: async (runtimeId) => { calls.push("health"); return base.health(runtimeId); },
      interrupt: async () => { calls.push("interrupt"); },
      stop: async () => { calls.push("stop"); },
      cleanup: async () => { calls.push("cleanup"); },
    });
    const controller = new PreviewRuntimeController(runtimeProvider);
    const runtime = await controller.start(request);
    assert.equal((await controller.health()).healthy, true);
    await controller.interrupt("operator");
    await controller.stop();
    await controller.cleanup();
    await controller.cleanup();
    assert.equal(runtime.runtimeId, "run_1");
    assert.deepEqual(calls, ["preflight", "start", "health", "health", "interrupt", "stop", "cleanup"]);
  });

  it("fails closed for missing isolation, generated preview, and identity mismatch", async () => {
    await assert.rejects(new PreviewRuntimeController(provider({ capabilities: { basePreview: true, generatedPreview: false, networkDenied: true, hostExecutionDenied: false } })).start(request), /isolation/i);
    await assert.rejects(new PreviewRuntimeController(provider()).start({ ...request, generated: true }), /generated preview/i);
    let cleaned = false;
    await assert.rejects(new PreviewRuntimeController(provider({
      start: async () => ({ runtimeId: "run_bad", origin: "http://127.0.0.1:3003", sourceRevision: "fffffff", repositoryDigest: digest }),
      cleanup: async () => { cleaned = true; },
    })).start(request), /attestation/i);
    assert.equal(cleaned, true);
  });

  it("binds each supported profile to its exact allowlisted runtime origin", async () => {
    const gocharbon = { ...request, profileId: "gocharbon.astro.hero.v1" };
    const matching = provider({
      start: async (input) => ({ runtimeId: "run_gocharbon", origin: "http://127.0.0.1:3002", sourceRevision: input.sourceRevision, repositoryDigest: input.repositoryDigest }),
    });
    assert.equal((await new PreviewRuntimeController(matching).start(gocharbon)).origin, "http://127.0.0.1:3002");
    await assert.rejects(new PreviewRuntimeController(provider()).start(gocharbon), (error: unknown) => error instanceof PreviewRuntimeAdmissionError && error.code === "runtimeMismatch");
  });

  it("times out without allowing a later start or host fallback", async () => {
    let started = false;
    const controller = new PreviewRuntimeController(provider({
      preflight: () => new Promise(() => undefined),
      start: async (input) => { started = true; return provider().start(input); },
    }), { timeoutMs: 5 });
    await assert.rejects(controller.start(request), (error: unknown) => error instanceof PreviewRuntimeAdmissionError && error.code === "timeout");
    assert.equal(started, false);
  });

  it("cleans a runtime that resolves after start timeout", async () => {
    let resolveStart!: (value: Awaited<ReturnType<PreviewRuntimeProvider["start"]>>) => void;
    const late = new Promise<Awaited<ReturnType<PreviewRuntimeProvider["start"]>>>((resolve) => { resolveStart = resolve; });
    const cleaned: string[] = [];
    const controller = new PreviewRuntimeController(provider({
      start: () => late,
      cleanup: async (runtimeId) => { cleaned.push(runtimeId); },
    }), { timeoutMs: 5 });
    await assert.rejects(controller.start(request), (error: unknown) => error instanceof PreviewRuntimeAdmissionError && error.code === "timeout");
    resolveStart({ runtimeId: "run_late", origin: "http://127.0.0.1:3003", sourceRevision: request.sourceRevision, repositoryDigest: request.repositoryDigest });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(cleaned, ["run_late"]);
  });

  it("cleans on health throw and health timeout", async () => {
    for (const health of [async () => { throw new Error("health failed"); }, () => new Promise<never>(() => undefined)]) {
      const cleaned: string[] = [];
      const controller = new PreviewRuntimeController(provider({ health, cleanup: async (runtimeId) => { cleaned.push(runtimeId); } }), { timeoutMs: 5 });
      await assert.rejects(controller.start(request));
      assert.deepEqual(cleaned, ["run_1"]);
    }
  });
});
