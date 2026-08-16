import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { STUDIO_CONTRACT_VERSION, type CompileIntent } from "../../src/studio/contracts.js";
import { REQUIRED_STUDIO_WORKER_CAPABILITIES, StudioCompileAdmissionError, StudioCompileAdmissionService, validateWorkerRequest, type StudioWorkerProvider } from "../../src/studio/workerProvider.js";

const now = new Date("2026-08-16T08:00:00.000Z");
const imageDigest = `sha256:${"a".repeat(64)}`;
const policyDigest = "b".repeat(64);
const intent: CompileIntent = {
  schemaVersion: STUDIO_CONTRACT_VERSION, intentId: "int_1", sessionId: "ses_1", variantId: "var_1", frozenCommandRevision: 1,
  sourceCommit: "c".repeat(40), repositoryDigest: "d".repeat(64), adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
  affectedSurfaceIds: ["hero.root"], affectedDimensions: ["design"], predictedImpactPaths: ["site/src/components/Hero.astro"], requiredEvidence: ["astro.test"],
  actorId: "usr_1", idempotencyKey: "idem_1", createdAt: now.toISOString(), status: "preflight",
};
const policy = { imageDigest, policyDigest, maxDurationMs: 60_000, maxMemoryBytes: 512 * 1024 * 1024, maxProcesses: 32 };

function provedProvider(capabilities: readonly (typeof REQUIRED_STUDIO_WORKER_CAPABILITIES)[number][] = REQUIRED_STUDIO_WORKER_CAPABILITIES): StudioWorkerProvider {
  return {
    providerId: "oci-worker",
    preflight: async (request) => ({ available: true, attestation: {
      providerId: "oci-worker", workerIdentity: "worker_1", runtimeClass: "io.containerd.runsc.v1", platform: "systrap",
      imageDigest: request.imageDigest, policyDigest: request.policyDigest, capabilities: [...capabilities], phase: request.phase, expiresAt: request.expiresAt,
    } }),
  };
}

describe("Studio dedicated OCI worker admission", () => {
  it("admits only the exact dedicated gVisor capability proof", async () => {
    const result = await new StudioCompileAdmissionService(provedProvider(), policy, () => now).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent });
    assert.equal(result.runtimeClass, "io.containerd.runsc.v1");
    assert.equal(result.platform, "systrap");
    assert.deepEqual(new Set(result.capabilities), new Set(REQUIRED_STUDIO_WORKER_CAPABILITIES));
  });

  it("fails closed when unavailable or one isolation capability is missing", async () => {
    await assert.rejects(new StudioCompileAdmissionService(undefined, policy, () => now).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerUnavailable");
    await assert.rejects(new StudioCompileAdmissionService(provedProvider(REQUIRED_STUDIO_WORKER_CAPABILITIES.slice(1)), policy, () => now).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerIncompatible");
  });

  it("rejects hostile verification envelopes with gateway or model access", () => {
    assert.throws(() => validateWorkerRequest({
      jobId: "job_1", tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intentId: "int_1",
      sourceRevision: "c".repeat(40), repositoryDigest: "d".repeat(64), imageDigest, policyDigest, phase: "verification",
      expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: "idem_1", maxDurationMs: 60_000,
      maxMemoryBytes: 512 * 1024 * 1024, maxProcesses: 32, outboundNetwork: "gatewayOnly", modelGatewayCapability: "singleJob",
    }, now), /deny network/i);
  });

  it("bounds preflight and releases both pending and late leases", async () => {
    let resolvePreflight!: (value: Awaited<ReturnType<StudioWorkerProvider["preflight"]>>) => void;
    const pending = new Promise<Awaited<ReturnType<StudioWorkerProvider["preflight"]>>>((resolve) => { resolvePreflight = resolve; });
    const released: { worker: string | undefined; reason: string }[] = [];
    const provider: StudioWorkerProvider = {
      providerId: "oci-worker",
      preflight: () => pending,
      release: async (_request, attestation, reason) => { released.push({ worker: attestation?.workerIdentity, reason }); },
    };
    const service = new StudioCompileAdmissionService(provider, policy, () => now, { preflightTimeoutMs: 5 });
    await assert.rejects(service.admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerUnavailable");
    resolvePreflight(await provedProvider().preflight({
      jobId: "job_1", tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intentId: intent.intentId,
      sourceRevision: intent.sourceCommit, repositoryDigest: intent.repositoryDigest, imageDigest, policyDigest, phase: "generation",
      expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: intent.idempotencyKey, maxDurationMs: 60_000,
      maxMemoryBytes: 512 * 1024 * 1024, maxProcesses: 32, outboundNetwork: "gatewayOnly", modelGatewayCapability: "singleJob",
    }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(released, [
      { worker: undefined, reason: "preflightTimedOut" },
      { worker: "worker_1", reason: "preflightTimedOut" },
    ]);
  });
});
