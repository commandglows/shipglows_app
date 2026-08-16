import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import { STUDIO_PREVIEW_CAPABILITIES, createTrustedBaseStudioCapability, type StudioCapabilityAdmission, type StudioCapabilityResolver } from "../../src/studio/capability.js";
import { STUDIO_CONTRACT_VERSION, type StudioCapability, type StudioDimension, type VisualCommand } from "../../src/studio/contracts.js";
import { StudioSessionError, StudioSessionService } from "../../src/studio/session.js";
import { REQUIRED_STUDIO_WORKER_CAPABILITIES, StudioCompileAdmissionService, studioWorkerScenarioDigest, type StudioWorkerProvider } from "../../src/studio/workerProvider.js";
import { MANAGED_SANDBOX_ATTESTATION_VERSION } from "../../src/studio/providers/attestation.js";
import { createManagedSandboxEvidenceVerifier } from "../../src/studio/providers/evidenceVerifier.js";
import { type ManagedSandboxResourceBudget } from "../../src/studio/providers/managedSandbox.js";

const actor = { tenantId: "ten_1", userId: "usr_1", projectId: "shipglows_app" };
const sourceRevision = "a".repeat(40);
const repositoryDigest = "b".repeat(64);
const projection = createTrustedBaseStudioCapability({ projectId: actor.projectId, previewOrigin: "http://127.0.0.1:3003", sourceRevision, expectedSourceRevision: sourceRevision, repositoryDigest, expectedRepositoryDigest: repositoryDigest, requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES });
assert.ok(projection);
const admission: StudioCapabilityAdmission = { projection, adapterVersion: "1.0.0", capabilityVersion: "1.0.0", allowedImpactPaths: ["site/src/components/Hero.astro"], requiredEvidence: ["astro.test"] };
const resolver: StudioCapabilityResolver = { resolve: () => projection, admit: () => admission };
const workerBudget: ManagedSandboxResourceBudget = {
  maxDurationMs: 60_000, maxVcpus: 2, maxMemoryBytes: 512 * 1024 * 1024, maxDiskBytes: 2 * 1024 * 1024 * 1024,
  maxProcesses: 32, maxOutputBytes: 16 * 1024 * 1024, maxConcurrentAllocations: 1, maxProviderApiCalls: 8,
  providerApiWindowMs: 60_000, maxTransferBytes: 64 * 1024 * 1024, maxModelTokens: 20_000,
  spendReservation: { currency: "USD", amountMicros: 250_000, reservationId: "spend_1" },
};

function ids() { let current = 0; return () => (++current).toString(16).padStart(32, "0"); }
function command(sessionId: string, revision: number, options: { kind?: StudioCapability; dimensions?: StudioDimension[]; nodes?: string[]; idempotencyKey?: string; compactionKey?: string } = {}): VisualCommand {
  const kind = options.kind ?? "token.set";
  const parameters = kind === "layout.reorder" ? { fromIndex: 0, toIndex: 1 } : kind === "motion.duration" ? { milliseconds: 200 } : { token: "color.accent", value: "brand" };
  return { schemaVersion: STUDIO_CONTRACT_VERSION, commandId: `cmd_${revision}`, sessionId, kind, parameters, affectedRuntimeNodeIds: options.nodes ?? ["hero.root"], affectedDimensions: options.dimensions ?? ["design"], provenance: { actorType: "operator", actorId: "operator" }, revision, idempotencyKey: options.idempotencyKey ?? `idem_${revision}`, previewOnly: true, requiredCapability: kind, requiredUnprotectedDimensions: options.dimensions ?? ["design"], ...(options.compactionKey === undefined ? {} : { compactionKey: options.compactionKey }) };
}

function worker(): StudioWorkerProvider { return { providerId: "fake-managed-sandbox", preflight: async (request) => ({ available: true, attestation: { providerId: "fake-managed-sandbox", workerIdentity: "worker_1", imageDigest: request.imageDigest, policyDigest: request.policyDigest, capabilities: [...REQUIRED_STUDIO_WORKER_CAPABILITIES], phase: request.phase, expiresAt: request.expiresAt, managedSandbox: { version: MANAGED_SANDBOX_ATTESTATION_VERSION, providerId: "fake-managed-sandbox", adapterVersion: "fake-1.0.0", accountScopeDigest: "e".repeat(64), projectScopeDigest: "9".repeat(64), observedResourceIdentityDigest: createHash("sha256").update("worker_1").digest("hex"), configurationDigest: "f".repeat(64), policyDigest: "d".repeat(64), imageDigest: "c".repeat(64), scenarioDigest: studioWorkerScenarioDigest(request), evidenceDigest: "1".repeat(64), proofState: "observed", observedBudget: workerBudget, observedAt: "2026-08-16T08:00:00.000Z", expiresAt: request.expiresAt, controls: { lifecycle: "attested", sourceIn: "unproved", artifactOut: "unproved", network: "attested", credentials: "attested", privateIngress: "unproved", persistence: "attested", snapshots: "unproved", quotas: "attested", cleanup: "attested" }, testedScenarios: ["fakeContract"], invalidationConditions: ["configurationChange"] } } }) }; }

describe("Studio session journal and compile boundary", () => {
  it("creates one session for concurrent idempotent admission and clears failed creation locks", async () => {
    let admissions = 0;
    let releaseAdmission!: () => void;
    const gate = new Promise<void>((resolve) => { releaseAdmission = resolve; });
    const delayed: StudioCapabilityResolver = {
      resolve: () => projection,
      admit: async () => { admissions += 1; await gate; return admission; },
    };
    const service = new StudioSessionService(delayed, undefined, undefined, ids());
    const first = service.create(actor, "create_atomic");
    const second = service.create(actor, "create_atomic");
    releaseAdmission();
    const [left, right] = await Promise.all([first, second]);
    assert.equal(left.sessionId, right.sessionId);
    assert.equal(admissions, 1);

    let fail = true;
    const retrying: StudioCapabilityResolver = {
      resolve: () => projection,
      admit: async () => { if (fail) { fail = false; throw new Error("transient"); } return admission; },
    };
    const retryService = new StudioSessionService(retrying, undefined, undefined, ids());
    await assert.rejects(retryService.create(actor, "create_retry"), /temporarily unavailable/i);
    assert.ok((await retryService.create(actor, "create_retry")).sessionId.startsWith("ses_"));
  });

  it("compacts scalar commands and round-trips undo and redo deterministically", async () => {
    const service = new StudioSessionService(resolver, undefined, () => new Date("2026-08-16T08:00:00Z"), ids());
    const created = await service.create(actor, "create_1");
    await service.applyCommand(actor, created.sessionId, command(created.sessionId, 1, { compactionKey: "hero.root:color" }));
    const compacted = await service.applyCommand(actor, created.sessionId, command(created.sessionId, 2, { idempotencyKey: "idem_2", compactionKey: "hero.root:color" }));
    assert.equal(compacted.commandCount, 1);
    assert.equal(compacted.revision, 2);
    const undone = await service.undo(actor, created.sessionId, "undo_1");
    assert.equal(undone.undoCursor, 0);
    assert.equal(undone.canRedo, true);
    const redone = await service.redo(actor, created.sessionId, "redo_1");
    assert.equal(redone.undoCursor, 1);
  });

  it("activates Laboratory for hard triggers and enforces variant limits", async () => {
    const service = new StudioSessionService(resolver, undefined, undefined, ids());
    const created = await service.create(actor, "create_2");
    const active = await service.applyCommand(actor, created.sessionId, command(created.sessionId, 1, { kind: "motion.duration", dimensions: ["motion"], nodes: ["hero.copy"] }));
    assert.equal(active.laboratory.mode, "active");
    for (let index = 0; index < 7; index += 1) await service.createVariant(actor, created.sessionId, `Variant ${index + 2}`, `variant_${index}`);
    await assert.rejects(service.createVariant(actor, created.sessionId, "Variant 9", "variant_9"), (error: unknown) => error instanceof StudioSessionError && error.code === "studioLimitExceeded");
  });

  it("keeps sessions actor/tenant scoped and expires without recovery fallback", async () => {
    let now = new Date("2026-08-16T08:00:00Z");
    const service = new StudioSessionService(resolver, undefined, () => now, ids());
    const created = await service.create(actor, "create_3");
    assert.throws(() => service.get({ ...actor, tenantId: "ten_2" }, created.sessionId), (error: unknown) => error instanceof StudioSessionError && error.statusCode === 403);
    now = new Date("2026-08-16T08:31:00Z");
    assert.throws(() => service.get(actor, created.sessionId), (error: unknown) => error instanceof StudioSessionError && error.code === "studioSessionExpired");
  });

  it("admits one immutable compile intent under replay and concurrency", async () => {
    const now = new Date("2026-08-16T08:00:00Z");
    const compile = new StudioCompileAdmissionService(worker(), { imageDigest: `sha256:${"c".repeat(64)}`, policyDigest: "d".repeat(64), resourceBudget: workerBudget }, () => now, { evidenceVerifier: createManagedSandboxEvidenceVerifier({ policy: { providerId: "fake-managed-sandbox", adapterVersion: "fake-1.0.0", accountScopeDigest: "e".repeat(64), projectScopeDigest: "9".repeat(64), configurationDigest: "f".repeat(64), policyDigest: "d".repeat(64), imageDigest: "c".repeat(64), requiredCapabilities: REQUIRED_STUDIO_WORKER_CAPABILITIES, resourceBudget: workerBudget }, authority: { verify: ({ evidence }) => evidence.evidenceDigest === "1".repeat(64) } }) });
    const service = new StudioSessionService(resolver, compile, () => now, ids());
    const created = await service.create(actor, "create_4");
    await service.applyCommand(actor, created.sessionId, command(created.sessionId, 1));
    const lab = await service.createVariant(actor, created.sessionId, "Accepted", "variant_create");
    assert.ok(lab.activeVariantId);
    const [first, replay] = await Promise.all([
      service.compile(actor, created.sessionId, lab.activeVariantId, "compile_1"),
      service.compile(actor, created.sessionId, lab.activeVariantId, "compile_1"),
    ]);
    assert.equal(first.intentId, replay.intentId);
    assert.equal(first.status, "accepted");
    assert.ok(Object.isFrozen(first));
    await assert.rejects(service.compile(actor, created.sessionId, lab.activeVariantId, "compile_2"), /different compile attempt/i);
  });

  it("fails compile closed when no dedicated worker exists and never creates a host fallback", async () => {
    const service = new StudioSessionService(resolver, undefined, undefined, ids());
    const created = await service.create(actor, "create_5");
    await service.applyCommand(actor, created.sessionId, command(created.sessionId, 1));
    const lab = await service.createVariant(actor, created.sessionId, "Accepted", "variant_create");
    assert.ok(lab.activeVariantId);
    const failed = await service.compile(actor, created.sessionId, lab.activeVariantId, "compile_1");
    assert.equal(failed.status, "failed");
    assert.equal(service.get(actor, created.sessionId).compileIntent?.status, "failed");
  });
});
