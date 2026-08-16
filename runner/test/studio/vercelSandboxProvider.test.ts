import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import type { StudioWorkerAdmissionRequest } from "../../src/studio/workerProvider.js";
import { createManagedSandboxEvidenceVerifier } from "../../src/studio/providers/evidenceVerifier.js";
import { MANAGED_SANDBOX_ATTESTATION_VERSION, type ManagedSandboxCapabilityAttestation } from "../../src/studio/providers/attestation.js";
import { REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES, type ManagedSandboxResourceBudget } from "../../src/studio/providers/managedSandbox.js";
import {
  VercelSandboxCleanupError,
  VercelSandboxProvider,
  VercelSandboxProviderConfigurationError,
  type VercelSandboxCreateInput,
  type VercelSandboxEvidenceInput,
  type VercelSandboxEvidenceVerifier,
  type VercelSandboxFacade,
  type VercelSandboxNetworkPolicy,
  type VercelSandboxRecord,
} from "../../src/studio/providers/vercelSandboxProvider.js";

const now = new Date("2026-08-16T08:00:00.000Z");
const imageDigest = `sha256:${"a".repeat(64)}`;
const policyDigest = "b".repeat(64);
const budget: ManagedSandboxResourceBudget = {
  maxDurationMs: 60_000, maxVcpus: 1, maxMemoryBytes: 512 * 1024 * 1024, maxDiskBytes: 2 * 1024 * 1024 * 1024,
  maxProcesses: 32, maxOutputBytes: 16 * 1024 * 1024, maxConcurrentAllocations: 1, maxProviderApiCalls: 8,
  providerApiWindowMs: 60_000, maxTransferBytes: 64 * 1024 * 1024, maxModelTokens: 20_000,
  spendReservation: { currency: "USD", amountMicros: 250_000, reservationId: "spend_1" },
};

function request(overrides: Partial<StudioWorkerAdmissionRequest> = {}): StudioWorkerAdmissionRequest {
  return {
    jobId: "job_1", tenantId: "ten_1", projectId: "prj_1", actorId: "usr_1", intentId: "int_1",
    sourceRevision: "c".repeat(40), repositoryDigest: "d".repeat(64), imageDigest, policyDigest, phase: "generation",
    expiresAt: new Date(now.getTime() + 60_000).toISOString(), idempotencyKey: "idem_1", resourceBudget: budget,
    maxDurationMs: budget.maxDurationMs, maxMemoryBytes: budget.maxMemoryBytes, maxProcesses: budget.maxProcesses,
    outboundNetwork: "gatewayOnly", modelGatewayCapability: "singleJob", ...overrides,
  };
}

class FakeVercelFacade implements VercelSandboxFacade {
  readonly creates: VercelSandboxCreateInput[] = [];
  readonly updates: { name: string; networkPolicy: VercelSandboxNetworkPolicy }[] = [];
  readonly probed: string[] = [];
  readonly inspected: string[] = [];
  readonly stopped: string[] = [];
  readonly deleted: string[] = [];
  readonly lists: unknown[] = [];
  failStop = false;
  failDelete = false;
  failList = false;
  expiresAtOffsetMs = 0;
  records: readonly VercelSandboxRecord[] = [];
  #policies = new Map<string, VercelSandboxNetworkPolicy>();

  async createSandbox(input: VercelSandboxCreateInput): Promise<VercelSandboxRecord> { this.creates.push(input); this.#policies.set(input.name, input.networkPolicy); return this.record(input, input.networkPolicy); }
  async probeSandbox(input: { readonly name: string }): Promise<void> { this.probed.push(input.name); if (!this.creates.some((entry) => entry.name === input.name)) throw new Error("not found"); }
  async updateNetworkPolicy(input: { readonly name: string; readonly networkPolicy: VercelSandboxNetworkPolicy }): Promise<void> { this.updates.push(input); this.#policies.set(input.name, input.networkPolicy); }
  async inspectSandbox(input: { readonly name: string }): Promise<VercelSandboxRecord> {
    this.inspected.push(input.name);
    const created = this.creates.find((entry) => entry.name === input.name);
    if (created === undefined) throw new Error("not found");
    return this.record(created, this.#policies.get(input.name) ?? "deny-all");
  }
  async stopSandbox(input: { readonly name: string }): Promise<void> { this.stopped.push(input.name); if (this.failStop) throw new Error("provider-secret-marker"); }
  async deleteSandbox(input: { readonly name: string }): Promise<void> { this.deleted.push(input.name); if (this.failDelete) throw new Error("provider-secret-marker"); }
  async listSandboxes(input: unknown): Promise<readonly VercelSandboxRecord[]> { this.lists.push(input); if (this.failList) throw new Error("provider-secret-marker"); return this.records; }

  private record(input: VercelSandboxCreateInput, networkPolicy: VercelSandboxNetworkPolicy): VercelSandboxRecord {
    return { resourceId: `res_${input.name.slice(-12)}`, name: input.name, image: input.image, persistent: false, timeout: input.timeout, vcpus: input.resources.vcpus, ports: [], networkPolicy, tags: input.tags, observedBudget: input.resourceBudget, expiresAt: new Date(now.getTime() + 60_000 + this.expiresAtOffsetMs).toISOString() };
  }
}

class FakeTrustedEvidence implements VercelSandboxEvidenceVerifier {
  readonly calls: VercelSandboxEvidenceInput[] = [];
  enabled = true;
  async verify(input: VercelSandboxEvidenceInput) {
    this.calls.push(input);
    if (!this.enabled) return undefined;
    const observed: ManagedSandboxCapabilityAttestation = {
      version: MANAGED_SANDBOX_ATTESTATION_VERSION, providerId: input.expected.providerId, adapterVersion: input.expected.adapterVersion,
      accountScopeDigest: input.expected.accountScopeDigest, projectScopeDigest: input.expected.projectScopeDigest,
      observedResourceIdentityDigest: digest(input.observed.resourceId), configurationDigest: input.expected.configurationDigest,
      policyDigest: input.expected.policyDigest, imageDigest: input.expected.imageDigest, scenarioDigest: input.expected.scenarioDigest, evidenceDigest: "e".repeat(64), proofState: "observed",
      observedBudget: input.expected.resourceBudget, observedAt: now.toISOString(), expiresAt: input.request.expiresAt,
      controls: { lifecycle: "attested", sourceIn: "notImplemented", artifactOut: "notImplemented", network: "attested", credentials: "attested", privateIngress: "unavailable", persistence: "attested", snapshots: "unavailable", quotas: "attested", cleanup: "attested" },
      testedScenarios: ["facadeProbe"], invalidationConditions: ["scopeChange"],
    };
    const verifier = createManagedSandboxEvidenceVerifier({ policy: { providerId: input.expected.providerId, adapterVersion: input.expected.adapterVersion, accountScopeDigest: input.expected.accountScopeDigest, projectScopeDigest: input.expected.projectScopeDigest, configurationDigest: input.expected.configurationDigest, policyDigest: input.expected.policyDigest, imageDigest: input.expected.imageDigest, requiredCapabilities: REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES, resourceBudget: input.expected.resourceBudget }, authority: { verify: () => true } });
    return { observed, verified: verifier.verify(observed, now) };
  }
}

function provider(client = new FakeVercelFacade(), evidence: VercelSandboxEvidenceVerifier | undefined | null = new FakeTrustedEvidence(), clock: () => Date = () => now, providerApiRateLimit = { maxProviderApiCalls: budget.maxProviderApiCalls, providerApiWindowMs: budget.providerApiWindowMs }, reconciliationLimit = 3): VercelSandboxProvider {
  return new VercelSandboxProvider({ client, imageRepository: "shipglows/studio-toolchain", accountScopeDigest: "f".repeat(64), projectScopeDigest: "2".repeat(64), configurationDigest: "1".repeat(64), maxVcpus: 2, providerApiRateLimit, reconciliationLimit, generationGateway: { host: "gateway.shipglows.example", brokerUrl: "https://gateway.shipglows.example" }, ...(evidence === null ? {} : { evidenceVerifier: evidence }), now: clock });
}

describe("VercelSandboxProvider account-free conformance", () => {
  it("is unproved by default and makes no provider call", async () => {
    const client = new FakeVercelFacade();
    assert.deepEqual(await provider(client, null).preflight(request()), { available: false, reason: "unproved" });
    assert.equal(client.creates.length, 0);
  });

  it("uses verified injected evidence only after deny-all creation and repeated inspection", async () => {
    const client = new FakeVercelFacade();
    const evidence = new FakeTrustedEvidence();
    const result = await provider(client, evidence).preflight(request());
    assert.equal(result.available, true);
    assert.equal(client.creates.length, 1);
    const created = client.creates[0]; assert.ok(created);
    assert.equal(created.persistent, false);
    assert.deepEqual(created.ports, []);
    assert.equal(created.networkPolicy, "deny-all");
    assert.equal(created.image, `shipglows/studio-toolchain@${imageDigest}`);
    assert.equal(created.resourceBudget, budget);
    assert.equal(client.updates.length, 1);
    assert.equal(client.probed.length, 1);
    assert.equal(client.inspected.length, 2);
    assert.equal(evidence.calls.length, 1);
    assert.equal(result.attestation.managedSandbox.proofState, "observed");
    assert.equal(/authorization|bearer|secret|token/i.test(JSON.stringify(client.updates)), false);
  });

  it("retains the exact observed evidence on idempotent reuse instead of refreshing it", async () => {
    const client = new FakeVercelFacade();
    const evidence = new FakeTrustedEvidence();
    const subject = provider(client, evidence);
    const first = await subject.preflight(request());
    const later = await subject.preflight(request());
    assert.ok(first.available); assert.ok(later.available);
    assert.strictEqual(later.attestation, first.attestation);
    assert.equal(client.creates.length, 1); assert.equal(evidence.calls.length, 1);
  });

  it("coalesces concurrent exact preflights and rejects same-key input conflicts", async () => {
    let releaseEvidence!: () => void;
    const gate = new Promise<void>((resolve) => { releaseEvidence = resolve; });
    class BlockingEvidence extends FakeTrustedEvidence {
      override async verify(input: VercelSandboxEvidenceInput) { await gate; return super.verify(input); }
    }
    const client = new FakeVercelFacade();
    const subject = provider(client, new BlockingEvidence());
    const first = subject.preflight(request());
    const replay = subject.preflight(request());
    assert.strictEqual(replay, first);
    const conflict = subject.preflight(request({ sourceRevision: "e".repeat(40) }));
    releaseEvidence();
    assert.deepEqual(await conflict, { available: false, reason: "incompatible" });
    const [left, right] = await Promise.all([first, replay]);
    assert.ok(left.available); assert.ok(right.available);
    assert.equal(client.creates.length, 1);
  });

  it("atomically reserves concurrent lifecycle plans without overbooking", async () => {
    let releaseEvidence!: () => void;
    const gate = new Promise<void>((resolve) => { releaseEvidence = resolve; });
    class BlockingEvidence extends FakeTrustedEvidence {
      override async verify(input: VercelSandboxEvidenceInput) { await gate; return super.verify(input); }
    }
    const concurrentBudget = { ...budget, maxConcurrentAllocations: 2 };
    const client = new FakeVercelFacade();
    const subject = provider(client, new BlockingEvidence());
    const first = subject.preflight(request({ resourceBudget: concurrentBudget }));
    assert.deepEqual(await subject.preflight(request({ jobId: "job_2", idempotencyKey: "idem_2", resourceBudget: concurrentBudget })), { available: false, reason: "quotaExceeded" });
    assert.equal(client.creates.length, 1);
    releaseEvidence();
    assert.equal((await first).available, true);
  });

  it("rejects cross-resource, stale-scenario, and time-mismatched observed evidence bundles", async () => {
    for (const mutate of [
      (value: ManagedSandboxCapabilityAttestation) => ({ ...value, observedResourceIdentityDigest: digest("worker_B") }),
      (value: ManagedSandboxCapabilityAttestation) => ({ ...value, scenarioDigest: "0".repeat(64) }),
      (value: ManagedSandboxCapabilityAttestation) => ({ ...value, observedAt: new Date(now.getTime() - 1).toISOString() }),
      (value: ManagedSandboxCapabilityAttestation) => ({ ...value, invalidationConditions: ["configurationChange"] }),
    ]) {
      class SplitEvidence extends FakeTrustedEvidence {
        override async verify(input: VercelSandboxEvidenceInput) {
          const bundle = await super.verify(input);
          assert.ok(bundle);
          return { observed: mutate(bundle.observed), verified: bundle.verified };
        }
      }
      const client = new FakeVercelFacade();
      assert.deepEqual(await provider(client, new SplitEvidence()).preflight(request()), { available: false, reason: "unproved" });
      assert.equal(client.stopped.length, 1); assert.equal(client.deleted.length, 1);
    }
  });

  it("keeps verification network-denied and uses a fresh resource", async () => {
    const roomy = { ...budget, maxProviderApiCalls: 20 };
    const generationRequest = request({ resourceBudget: roomy });
    const client = new FakeVercelFacade(); const subject = provider(client, undefined, () => now, { maxProviderApiCalls: roomy.maxProviderApiCalls, providerApiWindowMs: roomy.providerApiWindowMs });
    const generation = await subject.preflight(generationRequest);
    await subject.release(generationRequest, generation.available ? generation.attestation : undefined, "attestationRejected");
    const verification = await subject.preflight(request({ phase: "verification", outboundNetwork: "denied", modelGatewayCapability: "none", resourceBudget: { ...roomy, maxModelTokens: 0 }, maxDurationMs: roomy.maxDurationMs, maxMemoryBytes: roomy.maxMemoryBytes, maxProcesses: roomy.maxProcesses }));
    assert.equal(generation.available, true); assert.equal(verification.available, true);
    assert.equal(client.creates.length, 2); assert.equal(client.updates.length, 1);
    assert.notEqual(client.creates[0]?.name, client.creates[1]?.name);
  });

  it("fails closed before the facade for invalid budgets and an unreserved generation spend", async () => {
    const client = new FakeVercelFacade(); const subject = provider(client);
    const malformed = await subject.preflight(request({ resourceBudget: { ...budget, maxProviderApiCalls: 1 }, maxDurationMs: budget.maxDurationMs, maxMemoryBytes: budget.maxMemoryBytes, maxProcesses: budget.maxProcesses }));
    const cost = await subject.preflight(request({ resourceBudget: { ...budget, spendReservation: { ...budget.spendReservation, amountMicros: 0 } }, maxDurationMs: budget.maxDurationMs, maxMemoryBytes: budget.maxMemoryBytes, maxProcesses: budget.maxProcesses }));
    assert.deepEqual(malformed, { available: false, reason: "quotaExceeded" });
    assert.deepEqual(cost, { available: false, reason: "costBudgetExceeded" });
    assert.equal(client.creates.length, 0);
  });

  it("fails closed when trusted evidence is unavailable and cleans the temporary resource", async () => {
    const client = new FakeVercelFacade(); const evidence = new FakeTrustedEvidence(); evidence.enabled = false;
    assert.deepEqual(await provider(client, evidence).preflight(request()), { available: false, reason: "unproved" });
    assert.equal(client.stopped.length, 1); assert.equal(client.deleted.length, 1);
  });

  it("binds provider-observed expiry exactly and rejects a one-millisecond drift", async () => {
    for (const offset of [-1, 1]) {
      const client = new FakeVercelFacade(); client.expiresAtOffsetMs = offset;
      const result = await provider(client).preflight(request());
      assert.deepEqual(result, { available: false, reason: "incompatible" });
      assert.equal(client.creates.length, 1);
      assert.equal(client.stopped.length, 1); assert.equal(client.deleted.length, 1);
    }
    const exact = new FakeVercelFacade();
    assert.equal((await provider(exact).preflight(request())).available, true);
  });

  it("persists cleanup quarantine and never reuses the deterministic identifier", async () => {
    const roomy = { ...budget, maxProviderApiCalls: 20 };
    const client = new FakeVercelFacade(); const evidence = new FakeTrustedEvidence(); evidence.enabled = false; client.failStop = true;
    const subject = provider(client, evidence, () => now, { maxProviderApiCalls: roomy.maxProviderApiCalls, providerApiWindowMs: roomy.providerApiWindowMs }); const admission = request({ resourceBudget: roomy });
    assert.deepEqual(await subject.preflight(admission), { available: false, reason: "cleanupPending" });
    assert.equal(client.creates.length, 1);
    assert.deepEqual(await subject.preflight(request({ jobId: "job_2", idempotencyKey: "idem_2", resourceBudget: roomy })), { available: false, reason: "quotaExceeded" });
    assert.equal(client.creates.length, 1);
    assert.deepEqual(await subject.preflight(admission), { available: false, reason: "cleanupPending" });
    assert.equal(client.creates.length, 1);
    client.failStop = false;
    await subject.release(admission, undefined, "preflightUnavailable");
    assert.equal(client.deleted.length, 1);
    assert.deepEqual(await subject.preflight(admission), { available: false, reason: "unproved" });
    assert.equal(client.creates.length, 2);
  });

  it("closes lifecycle call accounting and quarantines a resource when cleanup has no remaining call", async () => {
    const client = new FakeVercelFacade();
    const constrained = { ...budget, maxProviderApiCalls: 6 };
    const result = await provider(client).preflight(request({ resourceBudget: constrained, maxDurationMs: constrained.maxDurationMs, maxMemoryBytes: constrained.maxMemoryBytes, maxProcesses: constrained.maxProcesses }));
    // Admission reserves seven calls, so no provider call can create an uncleanable resource.
    assert.deepEqual(result, { available: false, reason: "quotaExceeded" });
    assert.equal(client.creates.length, 0);
  });

  it("reserves verification's exact five-call boundary before create", async () => {
    const verificationBudget = { ...budget, maxProviderApiCalls: 5, maxModelTokens: 0 };
    const verification = request({ phase: "verification", outboundNetwork: "denied", modelGatewayCapability: "none", resourceBudget: verificationBudget });
    const client = new FakeVercelFacade();
    const subject = provider(client, undefined, () => now, { maxProviderApiCalls: 5, providerApiWindowMs: budget.providerApiWindowMs });
    const result = await subject.preflight(verification);
    assert.equal(result.available, true);
    await subject.release(verification, result.attestation, "attestationRejected");
    assert.equal(client.creates.length, 1); assert.equal(client.stopped.length, 1); assert.equal(client.deleted.length, 1);
  });

  it("retains cleanup slots on early failure and releases only demonstrably unused reservation", async () => {
    const roomy = { ...budget, maxConcurrentAllocations: 2, maxProviderApiCalls: 12 };
    const client = new FakeVercelFacade(); client.expiresAtOffsetMs = 1;
    const subject = provider(client, undefined, () => now, { maxProviderApiCalls: 12, providerApiWindowMs: budget.providerApiWindowMs });
    assert.deepEqual(await subject.preflight(request({ resourceBudget: roomy })), { available: false, reason: "incompatible" });
    assert.equal(client.stopped.length, 1); assert.equal(client.deleted.length, 1);
    assert.deepEqual(await subject.preflight(request({ jobId: "job_2", idempotencyKey: "idem_2", resourceBudget: roomy })), { available: false, reason: "incompatible" });
    assert.equal(client.creates.length, 2);
    assert.equal(client.stopped.length, 2); assert.equal(client.deleted.length, 2);
  });

  it("keeps failed stop retryable, quarantines delete uncertainty, and exposes reconciliation failure", async () => {
    const stopClient = new FakeVercelFacade(); const stopSubject = provider(stopClient); const admission = request();
    await stopSubject.preflight(admission); stopClient.failStop = true;
    await assert.rejects(stopSubject.release(admission, undefined, "attestationRejected"), (error: unknown) => error instanceof VercelSandboxCleanupError && error.code === "cleanupUncertain");
    assert.deepEqual(await stopSubject.preflight(admission), { available: false, reason: "cleanupPending" });
    assert.equal(stopClient.creates.length, 1);
    stopClient.failStop = false; await stopSubject.release(admission, undefined, "attestationRejected");
    assert.equal(stopClient.stopped.length, 2); assert.equal(stopClient.deleted.length, 1);

    const deleteClient = new FakeVercelFacade(); const deleteSubject = provider(deleteClient);
    await deleteSubject.preflight(admission); deleteClient.failDelete = true;
    await assert.rejects(deleteSubject.release(admission, undefined, "attestationRejected"), VercelSandboxCleanupError);
    deleteClient.failDelete = false; await deleteSubject.release(admission, undefined, "attestationRejected");
    assert.equal(deleteClient.stopped.length, 1); assert.equal(deleteClient.deleted.length, 2);

    const listClient = new FakeVercelFacade(); listClient.failList = true;
    await assert.rejects(provider(listClient).reconcile(), (error: unknown) => error instanceof VercelSandboxCleanupError && error.code === "reconciliationUnavailable");
  });

  it("reconciles only expired ShipGlows-labelled names", async () => {
    const client = new FakeVercelFacade();
    client.records = [record("sg-studio-old", true), record("other-old", true), record("sg-studio-live", false)];
    const result = await provider(client).reconcile();
    assert.deepEqual(result, { inspected: 3, released: 1 });
    assert.deepEqual(client.stopped, ["sg-studio-old"]); assert.deepEqual(client.deleted, ["sg-studio-old"]);
  });

  it("retries quarantined reconciliation cleanup and releases its durable reservation", async () => {
    let clock = now;
    const client = new FakeVercelFacade(); client.failStop = true;
    client.records = [record("sg-studio-orphan", true)];
    const subject = provider(client, undefined, () => clock);
    await assert.rejects(subject.reconcile(), (error: unknown) => error instanceof VercelSandboxCleanupError && error.code === "cleanupUncertain");
    assert.equal(client.lists.length, 1); assert.equal(client.stopped.length, 1); assert.equal(client.deleted.length, 0);

    client.failStop = false;
    clock = new Date(now.getTime() + budget.providerApiWindowMs + 1);
    assert.deepEqual(await subject.reconcile(), { inspected: 1, released: 1 });
    assert.equal(client.lists.length, 1); assert.equal(client.stopped.length, 2); assert.equal(client.deleted.length, 1);

    client.records = [];
    clock = new Date(clock.getTime() + budget.providerApiWindowMs + 1);
    assert.deepEqual(await subject.reconcile(), { inspected: 0, released: 0 });
    assert.equal(client.lists.length, 2);
  });

  it("fails reconciliation before list when its complete bounded plan cannot be reserved", async () => {
    const client = new FakeVercelFacade();
    client.records = [{ ...record("sg-studio-call-cap", true), observedBudget: { ...budget, maxProviderApiCalls: 3 } }];
    await assert.rejects(provider(client, undefined, () => now, { maxProviderApiCalls: 3, providerApiWindowMs: budget.providerApiWindowMs }).reconcile(), (error: unknown) => error instanceof VercelSandboxCleanupError && error.code === "reconciliationUnavailable");
    assert.equal(client.lists.length, 0); assert.equal(client.stopped.length, 0); assert.equal(client.deleted.length, 0);
  });

  it("blocks generation before create when reconciliation already consumed two calls in the shared window", async () => {
    const client = new FakeVercelFacade();
    const subject = provider(client);
    assert.deepEqual(await subject.reconcile(), { inspected: 0, released: 0 });
    assert.equal(client.lists.length, 1);
    assert.deepEqual(await subject.preflight(request()), { available: false, reason: "quotaExceeded" });
    assert.equal(client.creates.length, 0);
  });

  it("rejects unsafe credential-broker URLs before provider construction", () => {
    for (const brokerUrl of ["http://gateway.shipglows.example", "https://user:pass@gateway.shipglows.example", "https://other.shipglows.example", "https://gateway.shipglows.example/?x=1", "https://gateway.shipglows.example/path", "https://gateway.shipglows.example/#fragment"]) {
      assert.throws(() => new VercelSandboxProvider({ client: new FakeVercelFacade(), imageRepository: "shipglows/studio", accountScopeDigest: "f".repeat(64), projectScopeDigest: "2".repeat(64), configurationDigest: "1".repeat(64), maxVcpus: 1, providerApiRateLimit: { maxProviderApiCalls: budget.maxProviderApiCalls, providerApiWindowMs: budget.providerApiWindowMs }, generationGateway: { host: "gateway.shipglows.example", brokerUrl } }), VercelSandboxProviderConfigurationError);
    }
  });
});

function record(name: string, expired: boolean): VercelSandboxRecord { return { resourceId: `res_${name}`, name, image: "x", persistent: false, timeout: 1, vcpus: 1, ports: [], networkPolicy: "deny-all", tags: { shipglows: "studio", lifecycle: "ephemeral" }, observedBudget: budget, expiresAt: new Date(now.getTime() + (expired ? -1 : 1)).toISOString() }; }
function digest(value: string): string { return createHash("sha256").update(value).digest("hex"); }
