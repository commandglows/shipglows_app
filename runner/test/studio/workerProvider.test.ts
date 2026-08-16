import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import { STUDIO_CONTRACT_VERSION, type CompileIntent } from "../../src/studio/contracts.js";
import {
  REQUIRED_STUDIO_WORKER_CAPABILITIES,
  StudioCompileAdmissionError,
  StudioCompileAdmissionService,
  validateWorkerRequest,
  studioWorkerScenarioDigest,
  type StudioWorkerProvider,
} from "../../src/studio/workerProvider.js";
import {
  MANAGED_SANDBOX_ATTESTATION_VERSION,
  type ManagedSandboxCapabilityAttestation,
} from "../../src/studio/providers/attestation.js";
import { createManagedSandboxEvidenceVerifier } from "../../src/studio/providers/evidenceVerifier.js";
import { type ManagedSandboxResourceBudget } from "../../src/studio/providers/managedSandbox.js";

const now = new Date("2026-08-16T08:00:00.000Z");
const imageDigest = `sha256:${"a".repeat(64)}`;
const policyDigest = "b".repeat(64);
const intent: CompileIntent = {
  schemaVersion: STUDIO_CONTRACT_VERSION, intentId: "int_1", sessionId: "ses_1", variantId: "var_1", frozenCommandRevision: 1,
  sourceCommit: "c".repeat(40), repositoryDigest: "d".repeat(64), adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
  affectedSurfaceIds: ["hero.root"], affectedDimensions: ["design"], predictedImpactPaths: ["site/src/components/Hero.astro"], requiredEvidence: ["astro.test"],
  actorId: "usr_1", idempotencyKey: "idem_1", createdAt: now.toISOString(), status: "preflight",
};
const resourceBudget: ManagedSandboxResourceBudget = {
  maxDurationMs: 60_000, maxVcpus: 2, maxMemoryBytes: 512 * 1024 * 1024, maxDiskBytes: 2 * 1024 * 1024 * 1024,
  maxProcesses: 32, maxOutputBytes: 16 * 1024 * 1024, maxConcurrentAllocations: 1, maxProviderApiCalls: 8,
  providerApiWindowMs: 60_000, maxTransferBytes: 64 * 1024 * 1024, maxModelTokens: 20_000,
  spendReservation: { currency: "USD", amountMicros: 250_000, reservationId: "spend_1" },
};
const policy = { imageDigest, policyDigest, resourceBudget };
const projectScopeDigest = "9".repeat(64);

function evidenceVerifier(accept = true) {
  return createManagedSandboxEvidenceVerifier({
    policy: {
      providerId: "fake-managed-sandbox", adapterVersion: "fake-1.0.0", accountScopeDigest: "e".repeat(64),
      projectScopeDigest,
      configurationDigest: "f".repeat(64), policyDigest, imageDigest: "a".repeat(64),
      requiredCapabilities: REQUIRED_STUDIO_WORKER_CAPABILITIES, resourceBudget,
    },
    authority: { verify: ({ evidence }) => accept && evidence.evidenceDigest === "1".repeat(64) },
  });
}

function service(provider: StudioWorkerProvider | undefined, options: { preflightTimeoutMs?: number; acceptEvidence?: boolean } = {}) {
  return new StudioCompileAdmissionService(provider, policy, () => now, {
    ...(options.preflightTimeoutMs === undefined ? {} : { preflightTimeoutMs: options.preflightTimeoutMs }),
    evidenceVerifier: evidenceVerifier(options.acceptEvidence),
  });
}

function attestation(
  request: Parameters<StudioWorkerProvider["preflight"]>[0],
  controls: Partial<ManagedSandboxCapabilityAttestation["controls"]> = {},
): ManagedSandboxCapabilityAttestation {
  return {
    version: MANAGED_SANDBOX_ATTESTATION_VERSION,
    providerId: "fake-managed-sandbox",
    adapterVersion: "fake-1.0.0",
    accountScopeDigest: "e".repeat(64),
    projectScopeDigest,
    observedResourceIdentityDigest: createHash("sha256").update("worker_1").digest("hex"),
    configurationDigest: "f".repeat(64),
    policyDigest,
    imageDigest: "a".repeat(64),
    scenarioDigest: studioWorkerScenarioDigest(request),
    evidenceDigest: "1".repeat(64),
    proofState: "observed",
    observedBudget: resourceBudget,
    observedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60_000).toISOString(),
    controls: {
      lifecycle: "attested",
      sourceIn: "unproved",
      artifactOut: "unproved",
      network: "attested",
      credentials: "attested",
      privateIngress: "unproved",
      persistence: "attested",
      snapshots: "unproved",
      quotas: "attested",
      cleanup: "attested",
      ...controls,
    },
    testedScenarios: ["fakeContract"],
    invalidationConditions: ["configurationChange"],
  };
}

function provedProvider(capabilities: readonly (typeof REQUIRED_STUDIO_WORKER_CAPABILITIES)[number][] = REQUIRED_STUDIO_WORKER_CAPABILITIES): StudioWorkerProvider {
  return {
    providerId: "fake-managed-sandbox",
    preflight: async (request) => ({ available: true, attestation: {
      providerId: "fake-managed-sandbox", workerIdentity: "worker_1",
      imageDigest: request.imageDigest, policyDigest: request.policyDigest, capabilities: [...capabilities], phase: request.phase, expiresAt: request.expiresAt,
      managedSandbox: attestation(request),
    } }),
  };
}

describe("Studio provider-neutral managed sandbox admission", () => {
  it("admits only the exact managed-sandbox capability proof", async () => {
    const result = await service(provedProvider()).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent });
    assert.equal(result.providerId, "fake-managed-sandbox");
    assert.equal(result.managedSandbox.controls.network, "attested");
    assert.deepEqual(new Set(result.capabilities), new Set(REQUIRED_STUDIO_WORKER_CAPABILITIES));
  });

  it("deeply freezes the cloned request before provider preflight", async () => {
    let observed: NonNullable<Parameters<StudioWorkerProvider["preflight"]>[0]> | undefined;
    const provider: StudioWorkerProvider = {
      providerId: "fake-managed-sandbox",
      preflight: async (request) => {
        observed = request;
        assert.equal(Object.isFrozen(request.resourceBudget), true);
        assert.equal(Object.isFrozen(request.resourceBudget?.spendReservation), true);
        assert.throws(() => { (request.resourceBudget as { maxDiskBytes: number }).maxDiskBytes = 1; }, TypeError);
        return await provedProvider().preflight(request);
      },
    };
    const result = await service(provider).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent });
    (resourceBudget as { maxDiskBytes: number }).maxDiskBytes = 1;
    assert.equal(observed?.resourceBudget?.maxDiskBytes, 2 * 1024 * 1024 * 1024);
    assert.equal(Object.isFrozen(result.managedSandbox.observedBudget), true);
    (resourceBudget as { maxDiskBytes: number }).maxDiskBytes = 2 * 1024 * 1024 * 1024;
  });

  it("fails closed when unavailable or one isolation capability is missing", async () => {
    await assert.rejects(service(undefined).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerUnavailable");
    await assert.rejects(service(provedProvider(REQUIRED_STUDIO_WORKER_CAPABILITIES.slice(1))).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerIncompatible");
    await assert.rejects(service(provedProvider([...REQUIRED_STUDIO_WORKER_CAPABILITIES, REQUIRED_STUDIO_WORKER_CAPABILITIES[0]])).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerIncompatible");
  });

  it("rejects hostile verification envelopes with gateway or model access", () => {
    assert.throws(() => validateWorkerRequest({
      jobId: "job_1", tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intentId: "int_1",
      sourceRevision: "c".repeat(40), repositoryDigest: "d".repeat(64), imageDigest, policyDigest, phase: "verification",
      expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: "idem_1", resourceBudget, maxDurationMs: resourceBudget.maxDurationMs, maxMemoryBytes: resourceBudget.maxMemoryBytes, maxProcesses: resourceBudget.maxProcesses,
      outboundNetwork: "gatewayOnly", modelGatewayCapability: "singleJob",
    }, now), /deny network/i);
    assert.throws(() => validateWorkerRequest({
      jobId: "job_1", tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intentId: "int_1",
      sourceRevision: "c".repeat(40), repositoryDigest: "d".repeat(64), imageDigest, policyDigest, phase: "generation",
      expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: "idem_1", resourceBudget, maxDurationMs: resourceBudget.maxDurationMs, maxMemoryBytes: resourceBudget.maxMemoryBytes, maxProcesses: resourceBudget.maxProcesses,
      outboundNetwork: "denied", modelGatewayCapability: "none",
    }, now), /only the model gateway/i);
  });

  it("bounds preflight and releases both pending and late leases", async () => {
    let resolvePreflight!: (value: Awaited<ReturnType<StudioWorkerProvider["preflight"]>>) => void;
    const pending = new Promise<Awaited<ReturnType<StudioWorkerProvider["preflight"]>>>((resolve) => { resolvePreflight = resolve; });
    const released: { worker: string | undefined; reason: string }[] = [];
    const provider: StudioWorkerProvider = {
      providerId: "fake-managed-sandbox",
      preflight: () => pending,
      release: async (_request, attestation, reason) => { released.push({ worker: attestation?.workerIdentity, reason }); },
    };
    const admission = service(provider, { preflightTimeoutMs: 5 });
    await assert.rejects(admission.admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }), (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerUnavailable");
    resolvePreflight(await provedProvider().preflight({
      jobId: "job_1", tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intentId: intent.intentId,
      sourceRevision: intent.sourceCommit, repositoryDigest: intent.repositoryDigest, imageDigest, policyDigest, phase: "generation",
      expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: intent.idempotencyKey, resourceBudget, maxDurationMs: resourceBudget.maxDurationMs, maxMemoryBytes: resourceBudget.maxMemoryBytes, maxProcesses: resourceBudget.maxProcesses,
      outboundNetwork: "gatewayOnly", modelGatewayCapability: "singleJob",
    }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(released, [
      { worker: undefined, reason: "preflightTimedOut" },
      { worker: "worker_1", reason: "preflightTimedOut" },
    ]);
  });

  it("fails closed when the provider has not attested required lifecycle controls", async () => {
    const provider = provedProvider();
    provider.preflight = async (request) => ({
      available: true,
      attestation: {
        providerId: provider.providerId,
        workerIdentity: "worker_1",
        imageDigest: request.imageDigest,
        policyDigest: request.policyDigest,
        capabilities: [...REQUIRED_STUDIO_WORKER_CAPABILITIES],
        phase: request.phase,
        expiresAt: request.expiresAt,
        managedSandbox: attestation(request, { cleanup: "unproved" }),
      },
    });
    await assert.rejects(
      service(provider).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }),
      (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerIncompatible",
    );
  });

  it("does not echo provider-supplied unavailability detail", async () => {
    const provider: StudioWorkerProvider = {
      providerId: "fake-managed-sandbox",
      preflight: async () => ({ available: false, reason: "providerUnavailable" }),
    };
    await assert.rejects(
      service(provider).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }),
      (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerUnavailable" && !error.message.includes("providerUnavailable"),
    );
  });

  it("rejects self-labelled evidence even when the provider copies every expected capability", async () => {
    await assert.rejects(
      service(provedProvider(), { acceptEvidence: false }).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }),
      (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerIncompatible",
    );
  });

  it("rejects evidence for another worker or admission scenario", async () => {
    for (const mutate of [
      (proof: ManagedSandboxCapabilityAttestation) => ({ ...proof, observedResourceIdentityDigest: createHash("sha256").update("worker_A").digest("hex") }),
      (proof: ManagedSandboxCapabilityAttestation) => ({ ...proof, scenarioDigest: "0".repeat(64) }),
    ]) {
      const provider = provedProvider();
      provider.preflight = async (request) => {
        const result = await provedProvider().preflight(request);
        assert.ok(result.available);
        return { available: true, attestation: { ...result.attestation, workerIdentity: "worker_B", managedSandbox: mutate(attestation(request)) } };
      };
      await assert.rejects(
        service(provider).admit({ tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intent }),
        (error: unknown) => error instanceof StudioCompileAdmissionError && error.code === "workerIncompatible",
      );
    }
  });

  it("rejects a worker request with a missing explicit budget dimension", () => {
    assert.throws(() => validateWorkerRequest({
      jobId: "job_1", tenantId: "ten_1", projectId: "shipglows_app", actorId: "usr_1", intentId: "int_1",
      sourceRevision: "c".repeat(40), repositoryDigest: "d".repeat(64), imageDigest, policyDigest, phase: "generation",
      expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: "idem_1",
      resourceBudget: { ...resourceBudget, maxProviderApiCalls: 0 }, maxDurationMs: resourceBudget.maxDurationMs, maxMemoryBytes: resourceBudget.maxMemoryBytes, maxProcesses: resourceBudget.maxProcesses, outboundNetwork: "gatewayOnly", modelGatewayCapability: "singleJob",
    }, now), /resource budget/i);
  });
});
