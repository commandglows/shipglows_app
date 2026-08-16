/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  artifactContract,
  type CompilationArtifactManifestV1,
} from "../../src/studio/compilation/artifactPolicy.js";
import {
  canonicalJsonDigest,
  manifestAggregateDigest,
} from "../../src/studio/compilation/canonicalManifest.js";
import { CompilationCoordinator } from "../../src/studio/compilation/coordinator.js";
import {
  InMemoryPhaseCapabilityAuthority,
  type CompilationCoordinatorPorts,
  type CompilationOperationV1,
  type CompilationScopeV1,
  type LedgerAnchorV1,
  type PhaseEffectEvidenceV1,
  type VerificationConsumptionReceiptV1,
} from "../../src/studio/compilation/ports.js";
import type { ExactCapabilityV1 } from "../../src/studio/compilation/contracts.js";
import type { CompilationSourceManifestV1 } from "../../src/studio/compilation/sourcePolicy.js";
import {
  CompilationBudgetLedger,
  PILOT_COMPILATION_BUDGET,
  validateLedgerReservation,
  validateProviderUsageReceipt,
} from "../../src/studio/compilation/budgetLedger.js";

const id = "abcdefghijklmnopqrstuv",
  id2 = "bcdefghijklmnopqrstuvw",
  hex = "a".repeat(64),
  now = new Date("2026-08-16T10:00:00.000Z"),
  scope: CompilationScopeV1 = {
    jobId: id,
    tenantId: id,
    projectId: id,
    target: "astro_web",
    routeRequirementDigest: hex,
  },
  request = {
    schemaVersion: "compilation-coordinator-request-v1" as const,
    operationId: id,
    scope,
    expectedLedgerDigest: hex,
    expectedLedgerRevision: 0,
    budgetDigest: hex,
    planId: id,
    leaseId: id2,
    now,
  };
function source(): CompilationSourceManifestV1 {
  const entries = [
    {
      path: "src/index.ts",
      kind: "ordinary" as const,
      sizeBytes: 1,
      fileDigest: hex,
    },
  ];
  return {
    schemaVersion: "compilation-source-manifest-v1",
    jobId: id,
    tenantId: id,
    projectId: id,
    target: "astro_web",
    sourceRevision: "rev",
    entries,
    fileCount: 1,
    totalBytes: 1,
    sourceAggregateDigest: manifestAggregateDigest(entries),
    createdAt: now.toISOString(),
  };
}
function artifact(sourceDigest: string): CompilationArtifactManifestV1 {
  const entries = [
    {
      path: "index.html",
      mediaType: "text/html",
      mode: "0644" as const,
      sizeBytes: 1,
      fileDigest: hex,
    },
  ];
  return {
    schemaVersion: "compilation-artifact-manifest-v1",
    jobId: id,
    tenantId: id,
    projectId: id,
    target: "astro_web",
    sourceAggregateDigest: sourceDigest,
    toolchainDigest: hex,
    imageDigest: hex,
    artifactContractDigest: artifactContract("astro_web").contractDigest,
    entries,
    fileCount: 1,
    totalBytes: 1,
    artifactAggregateDigest: manifestAggregateDigest(entries),
    createdAt: now.toISOString(),
  };
}
function effect(
  operationId: string,
  phase: ExactCapabilityV1["phase"],
  generation: number,
  override: Partial<PhaseEffectEvidenceV1> = {},
): PhaseEffectEvidenceV1 {
  return {
    schemaVersion: "phase-effect-evidence-v1",
    operationId,
    phase,
    generation,
    evidenceDigest: hex,
    observedAt: now.toISOString(),
    ...override,
  };
}
function verification(
  leaseId: string,
  leaseDigest: string,
  generation: number,
): VerificationConsumptionReceiptV1 {
  const core = {
    schemaVersion: "verification-consumption-receipt-v1" as const,
    leaseId,
    leaseDigest,
    phase: "artifact_verification" as const,
    generation,
    consumedAt: now.toISOString(),
  };
  return { ...core, receiptDigest: canonicalJsonDigest(core) };
}
function releaseReceipt(
  operationId: string,
  reservationId: string,
  generation: number,
  previous: LedgerAnchorV1,
  current: LedgerAnchorV1,
) {
  const core = {
    schemaVersion: "release-reconciliation-receipt-v1" as const,
    operationId,
    reservationId,
    state: "released" as const,
    generation,
    previousLedgerDigest: previous.ledgerDigest,
    previousRevision: previous.revision,
    currentLedgerDigest: current.ledgerDigest,
    currentRevision: current.revision,
    evidenceDigest: hex,
    observedAt: now.toISOString(),
  };
  return { ...core, receiptDigest: canonicalJsonDigest(core) };
}
function settledA1Ledger() {
  const ledgerNow = new Date("2026-08-16T12:00:00.000Z"),
    ledger = new CompilationBudgetLedger(ledgerNow),
    reservation = validateLedgerReservation({
      schemaVersion: "ledger-reservation-v1",
      reservationId: id,
      chantierId: "shipglows-linux-compilation-workers",
      jobId: id,
      tenantId: id,
      projectId: id,
      attempt: 0,
      dimensions: PILOT_COMPILATION_BUDGET,
      reservedEur: "1.000000",
      ecbRateDate: "2026-08-16",
      ecbEurUsdRate: "2.000000",
      ecbEvidenceDigest: hex,
      contingencyBasisPoints: 1000,
      state: "reserved",
      retryEvidenceDigest: null,
      cleanupEvidenceDigest: null,
      createdAt: "2026-08-16T10:00:00.000Z",
      updatedAt: "2026-08-16T10:00:00.000Z",
      expiresAt: null,
    });
  ledger.reserve(reservation, 0, ledgerNow);
  ledger.observeCreate(id, 1, new Date("2026-08-16T12:00:30.000Z"));
  const core = {
      schemaVersion: "provider-usage-receipt-v1" as const,
      receiptId: "cdefghijklmnopqrstuvwx",
      provider: "vercel_sandbox" as const,
      providerReceiptDigest: hex,
      reservationId: id,
      jobId: id,
      providerResourceIdDigest: hex,
      activeCpuMs: 1,
      provisionedMemoryByteMs: 1,
      creationCount: 1 as const,
      controlCallCount: 1,
      durationMs: 1,
      peakMemoryBytes: 1,
      diskBytes: 1,
      processCount: 1,
      stdoutBytes: 1,
      stderrBytes: 1,
      ingressBytes: 1,
      sourceFileCount: 1,
      artifactFileCount: 1,
      vcrImageBytes: 1,
      vcrStorageByteMs: 1,
      snapshotStorageByteMs: 0 as const,
      egressBytes: 1,
      rawUsd: "0.100000",
      convertedEur: "0.050000",
      contingencyEur: "0.055000",
      observedAt: "2026-08-16T12:01:00.000Z",
      final: true,
    },
    receipt = validateProviderUsageReceipt({
      ...core,
      receiptDigest: canonicalJsonDigest(core),
    });
  ledger.settle(receipt, 2, true, new Date("2026-08-16T12:01:00.000Z"));
  return ledger;
}
function harness(
  options: {
    badReceipt?: boolean;
    uncertain?: boolean;
    terminalCasFailures?: number;
    seed?: CompilationOperationV1;
    delayAcquire?: boolean;
  } = {},
) {
  const calls: string[] = [],
    history: CompilationOperationV1[] = [],
    operations = new Map<string, CompilationOperationV1>();
  if (options.seed) operations.set(id, options.seed);
  let ledgerRevision = 0,
    terminalFailures = options.terminalCasFailures ?? 0;
  const next = (): LedgerAnchorV1 => ({
    ledgerDigest: String(++ledgerRevision).padStart(64, "b").slice(-64),
    revision: ledgerRevision,
  });
  let nonce = 0;
  const capabilities = new InMemoryPhaseCapabilityAuthority(
    () => `capability_${String(++nonce).padStart(22, "0")}`,
    () => now,
  );
  const ports: CompilationCoordinatorPorts = {
    capabilities,
    operations: {
      load: async (key) => operations.get(key) ?? null,
      create: async (op) => {
        if (operations.has(op.operationId)) return false;
        operations.set(op.operationId, op);
        history.push(op);
        return true;
      },
      complete: async (key, expected, op) => {
        const prior = operations.get(key);
        if (prior?.revision !== expected) return false;
        if (op.state !== "running" && terminalFailures-- > 0) return false;
        operations.set(key, op);
        history.push(op);
        return true;
      },
    },
    admission: {
      reserve: async (_s, _a, { generation, signal }) => {
        calls.push(`reserve:${generation}:${signal.aborted}`);
        const a = next();
        return { generation, value: { reservationId: id, ...a } };
      },
      acquire: async (_s, _r, { capability, generation, signal }) => {
        calls.push(
          `acquire:${generation}:${signal.aborted}:${capability.phase}`,
        );
        if (options.delayAcquire)
          await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          kind: "acquired",
          resourceIdDigest: hex,
          workerEvidenceDigest: hex,
          effect: effect(
            id,
            "admission",
            generation,
            options.badReceipt ? { generation: generation + 1 } : {},
          ),
        };
      },
    },
    ledger: {
      retryBeforeCreate: async (_s, _r, _a, { generation }) => {
        calls.push("retry");
        const a = next();
        return { generation, value: { reservationId: id2, ...a } };
      },
      observeCreate: async (_s, _r, _a, { generation }) => {
        calls.push("observe");
        return { generation, value: next() };
      },
      settle: async (_s, _r, _al, _c, _a, { generation }) => {
        calls.push("settle");
        return { generation, value: next() };
      },
      release: async (_s, _r, _a, { generation }) => {
        calls.push("ledgerRelease");
        return { generation, value: next() };
      },
      retain: async () => {
        calls.push("retain");
        return next();
      },
      reconcileCleanup: async () => {
        calls.push("reconcile");
        return next();
      },
      reconcileRelease: async (
        operationId,
        _s,
        reservation,
        expected,
        { generation },
      ) => {
        calls.push("reconcileRelease");
        const current = next();
        return {
          generation,
          value: releaseReceipt(
            operationId,
            reservation.reservationId,
            generation,
            expected,
            current,
          ),
        };
      },
    },
    source: {
      seal: async (_s, { generation, signal }) => {
        calls.push(`seal:${generation}:${signal.aborted}`);
        return { generation, value: source() };
      },
      ingress: async (_s, _a, _m, { generation, signal }) => {
        calls.push(`ingress:${generation}:${signal.aborted}`);
        return effect(id, "source_ingress", generation);
      },
    },
    sandbox: {
      execute: async (_r, { generation, signal }) => {
        calls.push(`execute:${generation}:${signal.aborted}`);
        return {
          stdoutDigest: hex,
          stderrDigest: hex,
          effect: effect(id, "execution", generation),
        };
      },
    },
    verifier: {
      verify: async (_s, _a, lease, { generation, signal }) => {
        calls.push(`verify:${generation}:${signal.aborted}`);
        lease.consume(now);
        const manifest = artifact(source().sourceAggregateDigest);
        return {
          generation,
          value: {
            manifest,
            artifactManifestDigest: canonicalJsonDigest(manifest),
            artifactAggregateDigest: manifest.artifactAggregateDigest,
            consumption: verification(
              lease.leaseId,
              lease.leaseDigest,
              generation,
            ),
          },
        };
      },
    },
    broker: {
      copyVerified: async (_s, _a, { generation, signal }) => {
        calls.push(`copy:${generation}:${signal.aborted}`);
        return { generation, value: { privateBrokerObjectDigest: hex } };
      },
      release: async (_s, _b, { generation, signal }) => {
        calls.push(`release:${generation}:${signal.aborted}`);
        return effect(id, "artifact_egress", generation);
      },
      revoke: async () => {
        calls.push("revoke");
      },
    },
    cleanup: {
      cleanupOnce: async (_o, _s, _a, { generation, signal }) => {
        calls.push(`cleanup:${generation}:${signal.aborted}`);
        return {
          generation,
          value: {
            cleanupEvidenceDigest: hex,
            resourceIdDigest: hex,
            observedAt: now.toISOString(),
            certain: !options.uncertain,
          },
        };
      },
    },
  };
  return {
    calls,
    history,
    operations,
    ports,
    coordinator: new CompilationCoordinator(
      ports,
      options.delayAcquire ? 1 : 600000,
    ),
  };
}

describe("provider-neutral compilation coordinator", () => {
  it("passes exact phase capabilities, generation and AbortSignal, and validates closed receipts", async () => {
    const good = harness(),
      result = await good.coordinator.compile(request);
    assert.equal(result.state, "released");
    assert.deepEqual(good.calls, [
      "reserve:1:false",
      "acquire:1:false:admission",
      "observe",
      "seal:1:false",
      "ingress:1:false",
      "execute:1:false",
      "verify:1:false",
      "copy:1:false",
      "cleanup:1:false",
      "settle",
      "release:1:false",
      "ledgerRelease",
    ]);
    const bad = harness({ badReceipt: true }),
      rejected = await bad.coordinator.compile(request);
    assert.equal(rejected.reason, "routeStale");
    assert.ok(!bad.calls.includes("observe"));
  });
  it("uses server nonces and atomically rejects forged, replayed, stale, cross-phase and cross-generation effects", async () => {
    let clock = new Date(now),
      counter = 0;
    const authority = new InMemoryPhaseCapabilityAuthority(
        () => `server_nonce_${String(++counter).padStart(22, "0")}`,
        () => clock,
      ),
      signal = new AbortController().signal,
      capability = await authority.issue(
        {
          operationId: id,
          generation: 1,
          capability: {
            schemaVersion: "admission-capability-v1",
            jobId: id,
            tenantId: id,
            projectId: id,
            target: "astro_web",
            routeRequirementDigest: hex,
            budgetDigest: hex,
            phase: "admission",
          },
        },
        signal,
      );
    assert.ok(!capability.capabilityId.startsWith(id));
    const valid = effect(id, "admission", 1);
    await assert.rejects(() =>
      authority.consume(
        capability,
        { ...valid, evidenceDigest: "bad" },
        id,
        1,
        signal,
      ),
    );
    await assert.rejects(() =>
      authority.consume(
        capability,
        { ...valid, phase: "execution" },
        id,
        1,
        signal,
      ),
    );
    await assert.rejects(() =>
      authority.consume(capability, { ...valid, generation: 2 }, id, 1, signal),
    );
    const receipt = await authority.consume(capability, valid, id, 1, signal);
    assert.equal(receipt.capabilityId, capability.capabilityId);
    await assert.rejects(() =>
      authority.consume(capability, valid, id, 1, signal),
    );
    clock = new Date(now.getTime() + 300001);
    const stale = await authority.issue(
      {
        operationId: id,
        generation: 2,
        capability: {
          schemaVersion: "admission-capability-v1",
          jobId: id,
          tenantId: id,
          projectId: id,
          target: "astro_web",
          routeRequirementDigest: hex,
          budgetDigest: hex,
          phase: "admission",
        },
      },
      signal,
    );
    clock = new Date(clock.getTime() + 300001);
    await assert.rejects(() =>
      authority.consume(
        stale,
        effect(id, "admission", 2, { observedAt: clock.toISOString() }),
        id,
        2,
        signal,
      ),
    );
  });
  it("persists an anchored generation checkpoint after every completed phase", async () => {
    const h = harness();
    await h.coordinator.compile(request);
    const operation = h.operations.get(id)!;
    assert.equal(operation.state, "released");
    assert.equal(operation.checkpoint?.phase, "ledgerReleased");
    assert.equal(operation.checkpoint?.generation, 1);
    assert.ok(operation.checkpoint?.reservation);
    assert.ok(operation.checkpoint?.allocation);
    assert.equal(operation.checkpoint?.anchor.revision, 4);
    assert.equal(
      operation.checkpointDigest,
      canonicalJsonDigest(operation.checkpoint),
    );
  });
  it("fences a restarted running generation, cleans and terminalizes durably", async () => {
    const context = {
      scope,
      generation: 3,
      phase: "executed" as const,
      reservation: { reservationId: id, ledgerDigest: hex, revision: 1 },
      allocation: { resourceIdDigest: hex, workerEvidenceDigest: hex },
      anchor: { ledgerDigest: hex, revision: 1 },
      cleanup: null,
      artifact: null,
      artifactDigest: null,
      broker: null,
      brokerDigest: null,
      egress: null,
      egressDigest: null,
      terminalIntent: null,
      terminalIntentDigest: null,
    };
    const seed: CompilationOperationV1 = {
        operationId: id,
        requestDigest: canonicalJsonDigest({
          schemaVersion: request.schemaVersion,
          operationId: request.operationId,
          scope: request.scope,
          expectedLedgerDigest: request.expectedLedgerDigest,
          expectedLedgerRevision: request.expectedLedgerRevision,
          budgetDigest: request.budgetDigest,
          planId: request.planId,
          leaseId: request.leaseId,
          now: request.now.toISOString(),
        }),
        state: "running",
        resultDigest: null,
        result: null,
        checkpointDigest: canonicalJsonDigest(context),
        checkpoint: context,
        revision: 7,
      },
      h = harness({ seed });
    const result = await h.coordinator.compile(request),
      stored = h.operations.get(id)!;
    assert.equal(result.state, "quarantined");
    assert.equal(stored.checkpoint?.generation, 4);
    assert.ok(h.calls.includes("cleanup:4:false"));
    assert.ok(h.calls.includes("settle"));
    assert.notEqual(result.reason, "providerUnavailable");
  });
  it("retries terminal CAS boundedly after artifact and ledger release", async () => {
    const h = harness({ terminalCasFailures: 2 }),
      result = await h.coordinator.compile(request);
    assert.equal(result.state, "released");
    assert.equal(h.calls.filter((x) => x === "release:1:false").length, 1);
    assert.equal(h.calls.filter((x) => x === "ledgerRelease").length, 1);
    assert.equal(h.operations.get(id)?.state, "released");
  });
  it("keeps terminal failure durable and rejects a corrupted stored result digest", async () => {
    const failedHarness = harness({ badReceipt: true });
    const first = await failedHarness.coordinator.compile(request),
      second = await new CompilationCoordinator(failedHarness.ports).compile(
        request,
      );
    assert.deepEqual(second, first);
    const stored = failedHarness.operations.get(id)!;
    failedHarness.operations.set(id, {
      ...stored,
      resultDigest: "b".repeat(64),
    });
    await assert.rejects(() =>
      new CompilationCoordinator(failedHarness.ports).compile(request),
    );
  });
  it("rejects redigested nested-context and terminal-result correlation forgeries", async () => {
    const nested = harness();
    await nested.coordinator.compile(request);
    const stored = nested.operations.get(id)!,
      terminal = stored.result as {
        publicResult: Record<string, unknown>;
        context: CompilationOperationV1["checkpoint"];
      },
      context = {
        ...terminal.context!,
        scope: { ...terminal.context!.scope, extra: true },
      } as never,
      forgedResult = { publicResult: terminal.publicResult, context };
    nested.operations.set(id, {
      ...stored,
      checkpoint: context,
      checkpointDigest: canonicalJsonDigest(context),
      result: forgedResult,
      resultDigest: canonicalJsonDigest(forgedResult),
    });
    await assert.rejects(
      () => new CompilationCoordinator(nested.ports).compile(request),
      /providerUnavailable/,
    );
    const correlated = harness();
    await correlated.coordinator.compile(request);
    const good = correlated.operations.get(id)!,
      value = good.result as {
        publicResult: Record<string, unknown>;
        context: CompilationOperationV1["checkpoint"];
      },
      publicResult = {
        ...value.publicResult,
        ledgerRevision: Number(value.publicResult["ledgerRevision"]) + 1,
      },
      bad = { publicResult, context: value.context };
    correlated.operations.set(id, {
      ...good,
      result: bad,
      resultDigest: canonicalJsonDigest(bad),
    });
    await assert.rejects(
      () => new CompilationCoordinator(correlated.ports).compile(request),
      /providerUnavailable/,
    );
  });
  it("awaits late allocation compensation before authoritative restart state", async () => {
    const h = harness({ delayAcquire: true }),
      result = await h.coordinator.compile(request);
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(h.calls.includes("cleanup:1:false"));
    const restarted = await new CompilationCoordinator(h.ports).compile(
      request,
    );
    assert.equal(restarted.state, "failed");
    assert.notEqual(restarted.reason, "providerUnavailable");
  });
  it("aborts the exact boundary signal on timeout", async () => {
    const h = harness(),
      observed: { aborted: boolean } = { aborted: false };
    h.ports.admission.reserve = async (_scope, _anchor, context) =>
      await new Promise((resolve) => {
        context.signal.addEventListener(
          "abort",
          () => {
            observed.aborted = context.signal.aborted;
            resolve({
              generation: context.generation,
              value: { reservationId: id, ledgerDigest: hex, revision: 1 },
            });
          },
          { once: true },
        );
      });
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(observed.aborted, true);
    assert.ok(!h.calls.some((call) => call.startsWith("acquire:")));
  });
  it("rejects reserve, acquire and execute generation mismatches before downstream effects", async () => {
    for (const boundary of ["reserve", "acquire", "execute"] as const) {
      const h = harness();
      if (boundary === "reserve") {
        const original = h.ports.admission.reserve.bind(h.ports.admission);
        h.ports.admission.reserve = async (...args) => {
          const result = await original(...args);
          return { ...result, generation: result.generation + 1 };
        };
      } else if (boundary === "acquire") {
        const original = h.ports.admission.acquire.bind(h.ports.admission);
        h.ports.admission.acquire = async (...args) => {
          const result = await original(...args);
          if (result.kind !== "acquired") return result;
          return {
            ...result,
            effect: {
              ...result.effect,
              generation: result.effect.generation + 1,
            },
          };
        };
      } else {
        const original = h.ports.sandbox.execute.bind(h.ports.sandbox);
        h.ports.sandbox.execute = async (...args) => {
          const result = await original(...args);
          return {
            ...result,
            effect: {
              ...result.effect,
              generation: result.effect.generation + 1,
            },
          };
        };
      }
      const result = await h.coordinator.compile(request);
      assert.ok(result.reason !== null, boundary);
      if (boundary === "reserve")
        assert.ok(!h.calls.some((call) => call.startsWith("acquire:")));
      if (boundary === "acquire") assert.ok(!h.calls.includes("observe"));
      if (boundary === "execute")
        assert.ok(!h.calls.some((call) => call.startsWith("verify:")));
    }
  });
  it("releases a reservation that resolves after timeout without a live slot", async () => {
    const h = harness(),
      live = new Set<string>();
    h.ports.admission.reserve = async (_scope, _anchor, { generation }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      live.add(id);
      return {
        generation,
        value: { reservationId: id, ledgerDigest: hex, revision: 1 },
      };
    };
    h.ports.ledger.release = async (
      _scope,
      reservation,
      _anchor,
      { generation },
    ) => {
      live.delete(reservation.reservationId);
      h.calls.push("lateReserveRelease");
      return {
        generation,
        value: { ledgerDigest: "b".repeat(64), revision: 2 },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual([...live], []);
    assert.ok(h.calls.includes("lateReserveRelease"));
    assert.equal(h.operations.get(id)?.checkpoint?.phase, "created");
  });
  it("cleans a resource acquired after timeout before any observe", async () => {
    const h = harness(),
      resources = new Set<string>();
    h.ports.admission.acquire = async (
      _scope,
      _reservation,
      { generation },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      resources.add(hex);
      return {
        kind: "acquired",
        resourceIdDigest: hex,
        workerEvidenceDigest: hex,
        effect: effect(id, "admission", generation),
      };
    };
    h.ports.cleanup.cleanupOnce = async (
      _operation,
      _scope,
      allocation,
      { generation },
    ) => {
      resources.delete(allocation.resourceIdDigest);
      h.calls.push("lateAcquireCleanup");
      return {
        generation,
        value: {
          cleanupEvidenceDigest: hex,
          resourceIdDigest: allocation.resourceIdDigest,
          observedAt: now.toISOString(),
          certain: true,
        },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual([...resources], []);
    assert.ok(h.calls.includes("lateAcquireCleanup"));
    assert.ok(!h.calls.includes("observe"));
  });
  it("retires a retry reservation that resolves after timeout without leaking its slot", async () => {
    const h = harness(),
      live = new Set<string>([id]);
    h.ports.admission.acquire = async () => ({
      kind: "definitelyNoCreate",
      operationId: id,
      generation: 1,
      reservationId: id,
      evidenceDigest: hex,
    });
    h.ports.ledger.retryBeforeCreate = async (
      _scope,
      _reservation,
      _anchor,
      { generation },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      live.delete(id);
      live.add(id2);
      return {
        generation,
        value: {
          reservationId: id2,
          ledgerDigest: "b".repeat(64),
          revision: 2,
        },
      };
    };
    h.ports.ledger.release = async (
      _scope,
      reservation,
      _anchor,
      { generation },
    ) => {
      live.delete(reservation.reservationId);
      h.calls.push("lateRetryRelease");
      return {
        generation,
        value: { ledgerDigest: "c".repeat(64), revision: 3 },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual([...live], []);
    assert.ok(h.calls.includes("lateRetryRelease"));
    assert.ok(!h.calls.includes("observe"));
  });
  it("retains quarantine when observeCreate resolves after timeout", async () => {
    const h = harness(),
      ledger = { anchor: hex, quarantined: false };
    h.ports.ledger.observeCreate = async (
      _scope,
      _reservation,
      _anchor,
      { generation },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      ledger.anchor = "b".repeat(64);
      return {
        generation,
        value: { ledgerDigest: ledger.anchor, revision: 2 },
      };
    };
    h.ports.ledger.retain = async (_scope, _reservation, anchor) => {
      ledger.anchor = anchor.ledgerDigest;
      ledger.quarantined = true;
      h.calls.push("lateObserveRetain");
      return anchor;
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(ledger.anchor, "b".repeat(64));
    assert.equal(ledger.quarantined, true);
    assert.ok(h.calls.includes("lateObserveRetain"));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "observed");
  });
  it("discards a sealed manifest that resolves after timeout", async () => {
    const h = harness();
    h.ports.source.seal = async (_scope, { generation }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      h.calls.push("lateSealResolved");
      return { generation, value: source() };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(h.calls.includes("lateSealResolved"));
    assert.ok(!h.calls.some((call) => call.startsWith("ingress:")));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "sealed");
  });
  it("revokes and cleans ingress that resolves after timeout", async () => {
    const h = harness(),
      revoked: string[] = [],
      cleaned: string[] = [];
    const revoke = h.ports.capabilities.revoke.bind(h.ports.capabilities);
    h.ports.capabilities.revoke = async (capability, ...args) => {
      revoked.push(capability.phase);
      await revoke(capability, ...args);
    };
    h.ports.source.ingress = async (
      _scope,
      _allocation,
      _manifest,
      { generation },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return effect(id, "source_ingress", generation);
    };
    h.ports.cleanup.cleanupOnce = async (
      _operation,
      _scope,
      allocation,
      { generation },
    ) => {
      cleaned.push(allocation.resourceIdDigest);
      return {
        generation,
        value: {
          cleanupEvidenceDigest: hex,
          resourceIdDigest: allocation.resourceIdDigest,
          observedAt: now.toISOString(),
          certain: true,
        },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.reason, "executionTimedOut");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(revoked, ["source_ingress"]);
    assert.ok(cleaned.length >= 1);
    assert.ok(!h.calls.some((call) => call.startsWith("execute:")));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "ingressed");
  });
  it("cleans and quarantines execution that resolves after timeout", async () => {
    const h = harness(),
      revoked: string[] = [],
      cleaned: string[] = [];
    const revoke = h.ports.capabilities.revoke.bind(h.ports.capabilities);
    h.ports.capabilities.revoke = async (capability, ...args) => {
      revoked.push(capability.phase);
      await revoke(capability, ...args);
    };
    h.ports.sandbox.execute = async (_request, { generation }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        stdoutDigest: hex,
        stderrDigest: hex,
        effect: effect(id, "execution", generation),
      };
    };
    h.ports.cleanup.cleanupOnce = async (
      _operation,
      _scope,
      allocation,
      { generation },
    ) => {
      cleaned.push(allocation.resourceIdDigest);
      return {
        generation,
        value: {
          cleanupEvidenceDigest: hex,
          resourceIdDigest: allocation.resourceIdDigest,
          observedAt: now.toISOString(),
          certain: true,
        },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.state, "quarantined");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(revoked, ["execution"]);
    assert.ok(cleaned.length >= 1);
    assert.ok(!h.calls.some((call) => call.startsWith("verify:")));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "executed");
  });
  it("revokes late verification evidence and never brokers it", async () => {
    const h = harness(),
      cleaned: string[] = [];
    h.ports.verifier.verify = async (
      _scope,
      _allocation,
      lease,
      { generation },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      lease.consume(now);
      const manifest = artifact(source().sourceAggregateDigest);
      return {
        generation,
        value: {
          manifest,
          artifactManifestDigest: canonicalJsonDigest(manifest),
          artifactAggregateDigest: manifest.artifactAggregateDigest,
          consumption: verification(
            lease.leaseId,
            lease.leaseDigest,
            generation,
          ),
        },
      };
    };
    h.ports.cleanup.cleanupOnce = async (
      _operation,
      _scope,
      allocation,
      { generation },
    ) => {
      cleaned.push(allocation.resourceIdDigest);
      return {
        generation,
        value: {
          cleanupEvidenceDigest: hex,
          resourceIdDigest: allocation.resourceIdDigest,
          observedAt: now.toISOString(),
          certain: true,
        },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.state, "quarantined");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(cleaned.length >= 1);
    assert.ok(!h.calls.some((call) => call.startsWith("copy:")));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "verified");
  });
  it("revokes a broker object copied after timeout", async () => {
    const h = harness(),
      brokerObjects = new Set<string>();
    h.ports.broker.copyVerified = async (_scope, _artifact, { generation }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      brokerObjects.add(hex);
      return { generation, value: { privateBrokerObjectDigest: hex } };
    };
    h.ports.broker.revoke = async (_scope, broker) => {
      brokerObjects.delete(broker.privateBrokerObjectDigest);
      h.calls.push("lateBrokerRevoke");
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.state, "quarantined");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual([...brokerObjects], []);
    assert.ok(h.calls.includes("lateBrokerRevoke"));
    assert.ok(!h.calls.some((call) => call.startsWith("release:")));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "brokered");
  });
  it("does not blindly retry cleanup after timeout and persists uncertain quarantine", async () => {
    const h = harness();
    let cleanupCalls = 0;
    h.ports.cleanup.cleanupOnce = async (
      _operation,
      _scope,
      allocation,
      { generation },
    ) => {
      cleanupCalls++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        generation,
        value: {
          cleanupEvidenceDigest: hex,
          resourceIdDigest: allocation.resourceIdDigest,
          observedAt: now.toISOString(),
          certain: true,
        },
      };
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.state, "quarantined");
    assert.equal(result.reason, "cleanupUncertain");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(cleanupCalls, 1);
    assert.equal(h.operations.get(id)?.checkpoint?.phase, "brokerCopied");
    const restarted = await new CompilationCoordinator(h.ports).compile(
      request,
    );
    assert.deepEqual(restarted, result);
  });
  it("retains the late settle anchor without releasing a live slot", async () => {
    const h = harness(),
      ledger = { anchor: hex, live: true, retained: false };
    h.ports.ledger.settle = async (
      _scope,
      _reservation,
      _allocation,
      _cleanup,
      _anchor,
      { generation },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      ledger.anchor = "b".repeat(64);
      return {
        generation,
        value: { ledgerDigest: ledger.anchor, revision: 7 },
      };
    };
    h.ports.ledger.retain = async (_scope, _reservation, anchor) => {
      ledger.anchor = anchor.ledgerDigest;
      ledger.retained = true;
      return anchor;
    };
    const result = await new CompilationCoordinator(h.ports, 1).compile(
      request,
    );
    assert.equal(result.state, "quarantined");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(ledger.anchor, "b".repeat(64));
    assert.equal(ledger.live, true);
    assert.equal(ledger.retained, true);
    assert.ok(!h.calls.some((call) => call.startsWith("release:")));
    assert.notEqual(h.operations.get(id)?.checkpoint?.phase, "settled");
  });
  it("keeps a late ledger release terminal and idempotent across restart", async () => {
    const h = harness(),
      ledger = { anchor: hex, live: true, releases: 0, retained: false };
    h.ports.ledger.release = async (
      _scope,
      _reservation,
      _anchor,
      { generation },
    ) => {
      ledger.releases++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      ledger.live = false;
      ledger.anchor = "b".repeat(64);
      return {
        generation,
        value: { ledgerDigest: ledger.anchor, revision: 9 },
      };
    };
    h.ports.ledger.retain = async (_scope, _reservation, anchor) => {
      ledger.anchor = anchor.ledgerDigest;
      ledger.retained = true;
      return anchor;
    };
    await assert.rejects(
      () => new CompilationCoordinator(h.ports, 1).compile(request),
      /executionTimedOut/,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(ledger.releases, 1);
    assert.equal(ledger.live, false);
    assert.equal(ledger.retained, false);
    const restarted = await new CompilationCoordinator(h.ports).compile(
      request,
    );
    assert.equal(restarted.state, "released");
    assert.equal(ledger.releases, 1);
    assert.ok(!h.calls.some((call) => call.startsWith("cleanup:2")));
  });
  it("recovers a durable terminal outbox after permanent post-release terminal CAS failure", async () => {
    const h = harness({ terminalCasFailures: 3 });
    await assert.rejects(
      () => h.coordinator.compile(request),
      /budgetUnavailable/,
    );
    const running = h.operations.get(id)!;
    assert.equal(running.state, "running");
    assert.equal(running.checkpoint?.phase, "ledgerReleased");
    assert.equal(running.checkpoint?.terminalIntent?.state, "released");
    const releaseCalls = h.calls.filter(
        (call) => call === "release:1:false",
      ).length,
      ledgerReleaseCalls = h.calls.filter(
        (call) => call === "ledgerRelease",
      ).length,
      cleanupCalls = h.calls.filter((call) =>
        call.startsWith("cleanup:"),
      ).length,
      settleCalls = h.calls.filter((call) => call === "settle").length;
    const recovered = await new CompilationCoordinator(h.ports).compile(
      request,
    );
    assert.equal(recovered.state, "released");
    assert.equal(
      h.calls.filter((call) => call === "release:1:false").length,
      releaseCalls,
    );
    assert.equal(
      h.calls.filter((call) => call === "ledgerRelease").length,
      ledgerReleaseCalls,
    );
    assert.equal(
      h.calls.filter((call) => call.startsWith("cleanup:")).length,
      cleanupCalls,
    );
    assert.equal(
      h.calls.filter((call) => call === "settle").length,
      settleCalls,
    );
  });
  it("integrates terminal release with the real A1 ledger without revival", async () => {
    const ledgerNow = new Date("2026-08-16T12:00:00.000Z"),
      ledger = new CompilationBudgetLedger(ledgerNow),
      reservation = validateLedgerReservation({
        schemaVersion: "ledger-reservation-v1",
        reservationId: id,
        chantierId: "shipglows-linux-compilation-workers",
        jobId: id,
        tenantId: id,
        projectId: id,
        attempt: 0,
        dimensions: PILOT_COMPILATION_BUDGET,
        reservedEur: "1.000000",
        ecbRateDate: "2026-08-16",
        ecbEurUsdRate: "2.000000",
        ecbEvidenceDigest: hex,
        contingencyBasisPoints: 1000,
        state: "reserved",
        retryEvidenceDigest: null,
        cleanupEvidenceDigest: null,
        createdAt: "2026-08-16T10:00:00.000Z",
        updatedAt: "2026-08-16T10:00:00.000Z",
        expiresAt: null,
      });
    ledger.reserve(reservation, 0, ledgerNow);
    ledger.observeCreate(id, 1, new Date("2026-08-16T12:00:30.000Z"));
    const receiptCore = {
        schemaVersion: "provider-usage-receipt-v1" as const,
        receiptId: "cdefghijklmnopqrstuvwx",
        provider: "vercel_sandbox" as const,
        providerReceiptDigest: hex,
        reservationId: id,
        jobId: id,
        providerResourceIdDigest: hex,
        activeCpuMs: 1,
        provisionedMemoryByteMs: 1,
        creationCount: 1 as const,
        controlCallCount: 1,
        durationMs: 1,
        peakMemoryBytes: 1,
        diskBytes: 1,
        processCount: 1,
        stdoutBytes: 1,
        stderrBytes: 1,
        ingressBytes: 1,
        sourceFileCount: 1,
        artifactFileCount: 1,
        vcrImageBytes: 1,
        vcrStorageByteMs: 1,
        snapshotStorageByteMs: 0 as const,
        egressBytes: 1,
        rawUsd: "0.100000",
        convertedEur: "0.050000",
        contingencyEur: "0.055000",
        observedAt: "2026-08-16T12:01:00.000Z",
        final: true,
      },
      receipt = validateProviderUsageReceipt({
        ...receiptCore,
        receiptDigest: canonicalJsonDigest(receiptCore),
      });
    ledger.settle(receipt, 2, true, new Date("2026-08-16T12:01:00.000Z"));
    const h = harness();
    let realReleases = 0;
    h.ports.ledger.release = async (
      _scope,
      _reservation,
      _anchor,
      { generation },
    ) => {
      realReleases++;
      const snapshot = ledger.release(
        id,
        ledger.snapshot().revision,
        new Date("2026-08-16T12:02:00.000Z"),
      );
      return {
        generation,
        value: {
          ledgerDigest: snapshot.ledger.ledgerDigest,
          revision: snapshot.revision,
        },
      };
    };
    const result = await h.coordinator.compile(request);
    assert.equal(result.state, "released");
    assert.equal(realReleases, 1);
    assert.deepEqual(ledger.snapshot().liveReservationIds, []);
    const restarted = await new CompilationCoordinator(h.ports).compile(
      request,
    );
    assert.deepEqual(restarted, result);
    assert.equal(realReleases, 1);
    assert.throws(
      () =>
        ledger.retain(
          id,
          ledger.snapshot().revision,
          new Date("2026-08-16T12:03:00.000Z"),
        ),
      /unavailable/i,
    );
  });
  it("converges immediate restart races against the real A1 ledger regardless of winner", async () => {
    for (const winner of ["original", "recovery"] as const) {
      const h = harness(),
        ledger = settledA1Ledger(),
        releaseRevision = ledger.snapshot().revision;
      let attempts = 0,
        effects = 0;
      const apply = (generation: number) => {
        const before = ledger.snapshot();
        if (before.revision !== releaseRevision) throw new Error("stale");
        const snapshot = ledger.release(
          id,
          before.revision,
          new Date("2026-08-16T12:02:00.000Z"),
        );
        effects++;
        return {
          generation,
          value: {
            ledgerDigest: snapshot.ledger.ledgerDigest,
            revision: snapshot.revision,
          },
        };
      };
      h.ports.ledger.release = async (
        _scope,
        _reservation,
        _anchor,
        { generation },
      ) => {
        attempts++;
        if (attempts === 1 && winner === "original") {
          const value = apply(generation);
          await new Promise((resolve) => setTimeout(resolve, 20));
          return value;
        }
        if (attempts === 1)
          await new Promise((resolve) => setTimeout(resolve, 20));
        return apply(generation);
      };
      h.ports.ledger.reconcileRelease = async (
        operationId,
        _scope,
        reservation,
        expected,
        { generation },
      ) => {
        const snapshot = ledger.snapshot(),
          current = {
            ledgerDigest: snapshot.ledger.ledgerDigest,
            revision: snapshot.revision,
          };
        return {
          generation,
          value: releaseReceipt(
            operationId,
            reservation.reservationId,
            generation,
            expected,
            current,
          ),
        };
      };
      await assert.rejects(
        () => new CompilationCoordinator(h.ports, 1).compile(request),
        /executionTimedOut/,
      );
      const recovered = await new CompilationCoordinator(h.ports).compile(
        request,
      );
      assert.equal(recovered.state, "released", winner);
      await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(effects, 1, winner);
      assert.deepEqual(ledger.snapshot().liveReservationIds, []);
      assert.equal(
        h.operations.get(id)?.checkpoint?.phase,
        "ledgerReleased",
        winner,
      );
      const repeated = await new CompilationCoordinator(h.ports).compile(
        request,
      );
      assert.deepEqual(repeated, recovered);
      assert.equal(effects, 1, winner);
    }
  });
  it("keeps artifactReleased recoverable when reconciliation proof is forged or unavailable", async () => {
    const sourceRun = harness();
    await sourceRun.coordinator.compile(request);
    const captured = sourceRun.history.find(
      (operation) =>
        operation.state === "running" &&
        operation.checkpoint?.phase === "artifactReleased",
    )!;
    for (const mutation of [
      "operation",
      "reservation",
      "generation",
      "state",
      "previous",
      "digest",
    ] as const) {
      const seed = {
          ...captured,
          state: "running" as const,
          result: null,
          resultDigest: null,
        },
        h = harness({ seed });
      h.ports.ledger.release = async () => {
        throw new Error("stale");
      };
      h.ports.ledger.reconcileRelease = async (
        operationId,
        _scope,
        reservation,
        expected,
        { generation },
      ) => {
        const current = {
            ledgerDigest: "b".repeat(64),
            revision: expected.revision + 1,
          },
          valid = releaseReceipt(
            operationId,
            reservation.reservationId,
            generation,
            expected,
            current,
          ),
          value =
            mutation === "operation"
              ? { ...valid, operationId: id2 }
              : mutation === "reservation"
                ? { ...valid, reservationId: id2 }
                : mutation === "generation"
                  ? { ...valid, generation: generation + 1 }
                  : mutation === "state"
                    ? { ...valid, state: "retained" }
                    : mutation === "previous"
                      ? { ...valid, previousRevision: expected.revision + 1 }
                      : { ...valid, receiptDigest: hex };
        return { generation, value: value as never };
      };
      await assert.rejects(() => h.coordinator.compile(request));
      assert.equal(
        h.operations.get(id)?.checkpoint?.phase,
        "artifactReleased",
        mutation,
      );
      assert.equal(h.operations.get(id)?.state, "running", mutation);
    }
  });
  it("rejects a canonically redigested no-op release reconciliation without checkpoint mutation", async () => {
    const sourceRun = harness();
    await sourceRun.coordinator.compile(request);
    const captured = sourceRun.history.find(
        (operation) =>
          operation.state === "running" &&
          operation.checkpoint?.phase === "artifactReleased",
      )!,
      seed = {
        ...captured,
        state: "running" as const,
        result: null,
        resultDigest: null,
      },
      h = harness({ seed });
    let beforeReconciliation: CompilationOperationV1 | undefined;
    h.ports.ledger.release = async () => {
      throw new Error("stale");
    };
    h.ports.ledger.reconcileRelease = async (
      operationId,
      _scope,
      reservation,
      expected,
      { generation },
    ) => {
      beforeReconciliation = structuredClone(h.operations.get(id)!);
      return {
        generation,
        value: releaseReceipt(
          operationId,
          reservation.reservationId,
          generation,
          expected,
          expected,
        ),
      };
    };
    await assert.rejects(
      () => h.coordinator.compile(request),
      /cleanupUncertain/,
    );
    assert.ok(beforeReconciliation);
    assert.deepEqual(h.operations.get(id), beforeReconciliation);
  });
  it("rejects a canonically redigested released terminal with an impossible earlier phase matrix", async () => {
    const h = harness();
    await h.coordinator.compile(request);
    const stored = h.operations.get(id)!,
      terminal = stored.result as {
        publicResult: Record<string, unknown>;
        context: NonNullable<CompilationOperationV1["checkpoint"]>;
      },
      context = { ...terminal.context, phase: "created" as const },
      forgedResult = { publicResult: terminal.publicResult, context },
      forged = {
        ...stored,
        checkpoint: context,
        checkpointDigest: canonicalJsonDigest(context),
        result: forgedResult,
        resultDigest: canonicalJsonDigest(forgedResult),
      };
    h.operations.set(id, forged);
    await assert.rejects(
      () => new CompilationCoordinator(h.ports).compile(request),
      /providerUnavailable/,
    );
    assert.deepEqual(h.operations.get(id), forged);
  });
  it("never retries thrown, forged, missing, stale, cross-generation or ambiguous no-create claims", async () => {
    const claims = [
      {
        kind: "definitelyNoCreate",
        operationId: id,
        generation: 1,
        reservationId: id,
        evidenceDigest: "bad",
      },
      {
        kind: "definitelyNoCreate",
        operationId: id2,
        generation: 1,
        reservationId: id,
        evidenceDigest: hex,
      },
      {
        kind: "definitelyNoCreate",
        operationId: id,
        generation: 2,
        reservationId: id,
        evidenceDigest: hex,
      },
      {
        kind: "ambiguous",
        operationId: id,
        generation: 1,
        reservationId: id,
        evidenceDigest: hex,
      },
      {
        kind: "created",
        operationId: id,
        generation: 1,
        reservationId: id,
        evidenceDigest: hex,
      },
      {
        kind: "other",
        operationId: id,
        generation: 1,
        reservationId: id,
        evidenceDigest: hex,
      },
      { kind: "definitelyNoCreate" },
    ];
    for (const claim of claims) {
      const h = harness();
      h.ports.admission.acquire = async () => claim as never;
      const result = await h.coordinator.compile(request);
      assert.ok(result.reason !== null);
      assert.ok(!h.calls.includes("retry"));
      assert.ok(h.calls.includes("retain"));
      assert.ok(!h.calls.includes("observe"));
    }
    const thrown = harness();
    thrown.ports.admission.acquire = async () => {
      throw new Error("arbitrary");
    };
    const rejected = await thrown.coordinator.compile(request);
    assert.ok(rejected.reason !== null);
    assert.ok(!thrown.calls.includes("retry"));
    assert.ok(thrown.calls.includes("retain"));
  });
  it("retries once only from an exact definitely-no-create receipt and remains restart-idempotent", async () => {
    const h = harness();
    let acquisitions = 0;
    const original = h.ports.admission.acquire.bind(h.ports.admission);
    h.ports.admission.acquire = async (...args) => {
      acquisitions++;
      if (acquisitions === 1)
        return {
          kind: "definitelyNoCreate",
          operationId: id,
          generation: 1,
          reservationId: id,
          evidenceDigest: hex,
        };
      return original(...args);
    };
    const first = await h.coordinator.compile(request);
    assert.equal(first.state, "released");
    assert.equal(h.calls.filter((call) => call === "retry").length, 1);
    assert.equal(acquisitions, 2);
    const revision = h.operations.get(id)?.revision;
    const restarted = await new CompilationCoordinator(h.ports).compile(
      request,
    );
    assert.deepEqual(restarted, first);
    assert.equal(h.calls.filter((call) => call === "retry").length, 1);
    assert.equal(acquisitions, 2);
    assert.equal(h.operations.get(id)?.revision, revision);
  });
  it("recovers each durable broker-to-release checkpoint without duplicate lifecycle effects", async () => {
    const sourceRun = harness();
    await sourceRun.coordinator.compile(request);
    for (const phase of [
      "brokerCopied",
      "cleaned",
      "ledgerSettled",
      "egressAuthorized",
      "artifactReleased",
      "ledgerReleased",
    ] as const) {
      const captured = sourceRun.history.find(
        (operation) =>
          operation.state === "running" &&
          operation.checkpoint?.phase === phase,
      );
      assert.ok(captured, phase);
      const seed = {
          ...captured,
          state: "running" as const,
          result: null,
          resultDigest: null,
        },
        h = harness({ seed });
      const recovered = await h.coordinator.compile(request);
      assert.ok(
        recovered.state === "quarantined" || recovered.state === "released",
        phase,
      );
      if (phase === "brokerCopied") assert.ok(h.calls.includes("revoke"));
      if (
        phase === "cleaned" ||
        phase === "ledgerSettled" ||
        phase === "egressAuthorized"
      ) {
        assert.ok(h.calls.includes("revoke"));
        assert.ok(!h.calls.some((call) => call.startsWith("cleanup:")), phase);
        assert.ok(!h.calls.includes("settle"), phase);
      }
      if (phase === "artifactReleased" || phase === "ledgerReleased") {
        assert.equal(recovered.state, "released");
        assert.ok(!h.calls.includes("revoke"), phase);
        assert.ok(!h.calls.some((call) => call.startsWith("cleanup:")), phase);
        assert.ok(!h.calls.includes("settle"), phase);
        assert.equal(
          h.calls.filter((call) => call === "ledgerRelease").length,
          phase === "artifactReleased" ? 1 : 0,
          phase,
        );
      }
      const repeated = await new CompilationCoordinator(h.ports).compile(
        request,
      );
      assert.deepEqual(repeated, recovered);
    }
  });
  it("reconciles cleanup only from exact durable terminal context", async () => {
    const h = harness({ uncertain: true }),
      first = await h.coordinator.compile(request),
      operation = h.operations.get(id)!;
    assert.equal(first.state, "quarantined");
    const anchor = await h.coordinator.reconcileCleanup({
      operationId: id,
      providerResourceIdDigest: hex,
      cleanupEvidenceDigest: "b".repeat(64),
      observedAt: now.toISOString(),
      expectedOperationRevision: operation.revision,
      now,
    });
    assert.ok(anchor.revision > first.ledgerRevision);
    assert.ok(h.calls.includes("reconcile"));
  });
  it("stays disabled by default and never exposes a host execution surface", async () => {
    assert.equal(
      (await new CompilationCoordinator(null).compile(request)).reason,
      "disabled",
    );
    const text = JSON.stringify(harness().ports);
    assert.ok(!/spawn|execFile|child_process|shell/i.test(text));
  });
});
