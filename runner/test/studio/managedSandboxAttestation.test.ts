import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MANAGED_SANDBOX_ATTESTATION_VERSION,
  ManagedSandboxAttestationError,
  validateManagedSandboxAttestation,
  type ManagedSandboxCapabilityAttestation,
} from "../../src/studio/providers/attestation.js";
import {
  REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES,
  MANAGED_SANDBOX_REQUIRED_ALLOCATION_LIFECYCLE_CALLS,
  isManagedSandboxProviderLifecycleCallAccounting,
  isManagedSandboxResourceBudget,
  type ManagedSandboxResourceBudget,
} from "../../src/studio/providers/managedSandbox.js";
import {
  ManagedSandboxEvidenceVerificationError,
  assertManagedSandboxVerifiedEvidence,
  createManagedSandboxEvidenceVerifier,
} from "../../src/studio/providers/evidenceVerifier.js";

const now = new Date("2026-08-16T08:00:00.000Z");
const budget: ManagedSandboxResourceBudget = {
  maxDurationMs: 60_000,
  maxVcpus: 2,
  maxMemoryBytes: 512 * 1024 * 1024,
  maxDiskBytes: 2 * 1024 * 1024 * 1024,
  maxProcesses: 32,
  maxOutputBytes: 16 * 1024 * 1024,
  maxConcurrentAllocations: 1,
  maxProviderApiCalls: 8,
  providerApiWindowMs: 60_000,
  maxTransferBytes: 64 * 1024 * 1024,
  maxModelTokens: 20_000,
  spendReservation: { currency: "USD", amountMicros: 250_000, reservationId: "spend_1" },
};

function proof(
  controls: Partial<ManagedSandboxCapabilityAttestation["controls"]> = {},
): ManagedSandboxCapabilityAttestation {
  return {
    version: MANAGED_SANDBOX_ATTESTATION_VERSION,
    providerId: "fake-managed-sandbox",
    adapterVersion: "fake-1.0.0",
    accountScopeDigest: "a".repeat(64),
    projectScopeDigest: "9".repeat(64),
    observedResourceIdentityDigest: "b".repeat(64),
    configurationDigest: "c".repeat(64),
    policyDigest: "d".repeat(64),
    imageDigest: "e".repeat(64),
    scenarioDigest: "f".repeat(64),
    evidenceDigest: "1".repeat(64),
    proofState: "observed",
    observedBudget: budget,
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

const verifier = createManagedSandboxEvidenceVerifier({
  policy: {
    providerId: "fake-managed-sandbox",
    adapterVersion: "fake-1.0.0",
    accountScopeDigest: "a".repeat(64),
    projectScopeDigest: "9".repeat(64),
    configurationDigest: "c".repeat(64),
    policyDigest: "d".repeat(64),
    imageDigest: "e".repeat(64),
    requiredCapabilities: REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES,
    resourceBudget: budget,
  },
  authority: { verify: ({ evidence }) => evidence.evidenceDigest === "1".repeat(64) },
});

function validate(attestation: ManagedSandboxCapabilityAttestation): void {
  validateManagedSandboxAttestation(attestation, { expectedProviderId: "fake-managed-sandbox", now });
  verifier.verify(attestation, now);
}

describe("managed sandbox capability attestation", () => {
  it("keeps provider brands and runtime brands outside the contract", () => {
    assert.equal(/vercel|containerd|gvisor|runsc|systrap/i.exec(JSON.stringify(REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES)), null);
  });

  it("admits only evidence-backed admission controls while preserving deferred states", () => {
    const result = proof({
      sourceIn: "notImplemented",
      artifactOut: "unavailable",
      privateIngress: "unavailable",
      snapshots: "unavailable",
    });
    validate(result);
    assert.equal(result.controls.sourceIn, "notImplemented");
    assert.equal(result.controls.artifactOut, "unavailable");
    assert.equal(result.controls.privateIngress, "unavailable");
    assert.equal(result.controls.snapshots, "unavailable");
  });

  for (const control of ["lifecycle", "network", "credentials", "quotas", "cleanup"] as const) {
    it(`fails closed when ${control} is not attested`, () => {
      assert.throws(() => validate(proof({ [control]: "unavailable" })), ManagedSandboxAttestationError);
    });
  }

  it("rejects stale, malformed, cross-provider, and replay-ambiguous proof", () => {
    assert.throws(() => validate({ ...proof(), expiresAt: now.toISOString() }), ManagedSandboxAttestationError);
    assert.throws(() => validate({ ...proof(), providerId: "another-provider" }), ManagedSandboxAttestationError);
    assert.throws(() => validate({ ...proof(), testedScenarios: ["fakeContract", "fakeContract"] }), ManagedSandboxAttestationError);
    assert.throws(() => validate({ ...proof(), controls: { ...proof().controls, export: "attested" } as ManagedSandboxCapabilityAttestation["controls"] }), ManagedSandboxAttestationError);
  });

  it("rejects self-labelled, stale, and digest-mismatched evidence before it becomes verified", () => {
    assert.throws(() => verifier.verify({ ...proof(), proofState: "unproved" }, now), ManagedSandboxEvidenceVerificationError);
    assert.throws(() => verifier.verify({ ...proof(), configurationDigest: "0".repeat(64) }, now), ManagedSandboxEvidenceVerificationError);
    assert.throws(() => verifier.verify({ ...proof(), expiresAt: now.toISOString() }, now), ManagedSandboxEvidenceVerificationError);
    assert.throws(() => assertManagedSandboxVerifiedEvidence(proof()), ManagedSandboxEvidenceVerificationError);
  });

  it("fails verification when a required budget dimension is missing, widened, or not independently reserved", () => {
    assert.throws(() => verifier.verify({ ...proof(), observedBudget: { ...budget, maxDiskBytes: 0 } }, now), ManagedSandboxEvidenceVerificationError);
    assert.throws(() => verifier.verify({ ...proof(), observedBudget: { ...budget, maxTransferBytes: budget.maxTransferBytes + 1 } }, now), ManagedSandboxEvidenceVerificationError);
    assert.throws(() => verifier.verify({ ...proof(), observedBudget: { ...budget, spendReservation: { ...budget.spendReservation, reservationId: "spend_other" } } }, now), ManagedSandboxEvidenceVerificationError);
    assert.throws(() => verifier.verify({ ...proof(), observedBudget: { ...budget, spendReservation: { ...budget.spendReservation, currency: "EUR" as never } } }, now), ManagedSandboxEvidenceVerificationError);
  });

  it("deeply isolates and freezes trusted policy and verified evidence", () => {
    const mutableBudget = { ...budget, spendReservation: { ...budget.spendReservation } };
    const mutablePolicy = {
      providerId: "fake-managed-sandbox", adapterVersion: "fake-1.0.0", accountScopeDigest: "a".repeat(64),
      projectScopeDigest: "9".repeat(64),
      configurationDigest: "c".repeat(64), policyDigest: "d".repeat(64), imageDigest: "e".repeat(64),
      requiredCapabilities: [...REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES], resourceBudget: mutableBudget,
    };
    const isolated = createManagedSandboxEvidenceVerifier({ policy: mutablePolicy, authority: { verify: () => true } });
    mutableBudget.maxDiskBytes = 0;
    mutableBudget.spendReservation.amountMicros = 0;
    const submitted = { ...proof(), observedBudget: { ...budget, spendReservation: { ...budget.spendReservation } } };
    const result = isolated.verify(submitted, now);
    submitted.observedBudget.maxDiskBytes = 1;
    submitted.observedBudget.spendReservation.amountMicros = 1;
    assert.equal(result.observedBudget.maxDiskBytes, budget.maxDiskBytes);
    assert.equal(result.observedBudget.spendReservation.amountMicros, budget.spendReservation.amountMicros);
    assert.throws(() => { (result.observedBudget as { maxDiskBytes: number }).maxDiskBytes = 1; }, TypeError);
    assert.throws(() => { (result.observedBudget.spendReservation as { amountMicros: number }).amountMicros = 1; }, TypeError);
  });

  it("rejects non-canonical currency and enforces the closed lifecycle call accounting budget", () => {
    assert.equal(isManagedSandboxResourceBudget({ ...budget, spendReservation: { ...budget.spendReservation, currency: "EUR" as never } }), false);
    assert.equal(isManagedSandboxResourceBudget({ ...budget, spendReservation: { ...budget.spendReservation, currency: "BTC" as never } }), false);
    assert.equal(isManagedSandboxProviderLifecycleCallAccounting(MANAGED_SANDBOX_REQUIRED_ALLOCATION_LIFECYCLE_CALLS, { ...budget, maxProviderApiCalls: MANAGED_SANDBOX_REQUIRED_ALLOCATION_LIFECYCLE_CALLS.length - 1 }), false);
    assert.equal(isManagedSandboxProviderLifecycleCallAccounting(MANAGED_SANDBOX_REQUIRED_ALLOCATION_LIFECYCLE_CALLS, budget), true);
    assert.equal(isManagedSandboxProviderLifecycleCallAccounting([...MANAGED_SANDBOX_REQUIRED_ALLOCATION_LIFECYCLE_CALLS, "list", "reconcile", "inspect", "update", "create"], budget), false);
  });
});
