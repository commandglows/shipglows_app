import {
  REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES,
  type ManagedSandboxCapability,
  type ManagedSandboxControl,
  type ManagedSandboxResourceBudget,
  isManagedSandboxResourceBudget,
  sameManagedSandboxResourceBudget,
  freezeManagedSandboxResourceBudget,
} from "./managedSandbox.js";
import {
  ManagedSandboxAttestationError,
  freezeManagedSandboxCapabilityAttestation,
  validateManagedSandboxAttestation,
  type ManagedSandboxCapabilityAttestation,
  type ManagedSandboxObservedEvidence,
} from "./attestation.js";

export interface ManagedSandboxEvidencePolicy {
  readonly providerId: string;
  readonly adapterVersion: string;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  readonly configurationDigest: string;
  readonly policyDigest: string;
  readonly imageDigest: string;
  readonly requiredCapabilities: readonly ManagedSandboxCapability[];
  readonly resourceBudget: ManagedSandboxResourceBudget;
}

export interface ManagedSandboxEvidenceAuthority {
  verify(input: { readonly evidence: ManagedSandboxCapabilityAttestation; readonly policy: ManagedSandboxEvidencePolicy }): boolean;
}

export interface ManagedSandboxVerifiedEvidence extends Omit<ManagedSandboxObservedEvidence, "proofState"> {
  readonly proofState: "verified";
  readonly verifiedAt: string;
}

export interface ManagedSandboxEvidenceVerifier {
  verify(evidence: ManagedSandboxCapabilityAttestation, now?: Date): ManagedSandboxVerifiedEvidence;
}

export class ManagedSandboxEvidenceVerificationError extends Error {
  constructor() {
    super("Managed sandbox evidence is not externally verified.");
    this.name = "ManagedSandboxEvidenceVerificationError";
  }
}

const verifiedEvidence = new WeakSet();
const digest = /^[a-f0-9]{64}$/;
const opaque = /^[A-Za-z0-9._:-]{1,128}$/;
const admissionControls: readonly ManagedSandboxControl[] = ["lifecycle", "network", "credentials", "quotas", "cleanup"];

export function createManagedSandboxEvidenceVerifier(input: {
  readonly policy: ManagedSandboxEvidencePolicy;
  readonly authority: ManagedSandboxEvidenceAuthority;
}): ManagedSandboxEvidenceVerifier {
  const policy = freezeManagedSandboxEvidencePolicy(input.policy);
  validatePolicy(policy);
  return {
    verify: (evidence, now = new Date()) => {
      const frozenEvidence = freezeManagedSandboxCapabilityAttestation(evidence);
      try {
        validateManagedSandboxAttestation(frozenEvidence, { expectedProviderId: policy.providerId, now });
      } catch (error) {
        if (error instanceof ManagedSandboxAttestationError) throw new ManagedSandboxEvidenceVerificationError();
        throw error;
      }
      const controls = frozenEvidence.controls as Record<string, unknown>;
      const matchesPolicy = frozenEvidence.proofState === "observed" &&
        frozenEvidence.adapterVersion === policy.adapterVersion &&
        frozenEvidence.accountScopeDigest === policy.accountScopeDigest &&
        frozenEvidence.projectScopeDigest === policy.projectScopeDigest &&
        frozenEvidence.configurationDigest === policy.configurationDigest &&
        frozenEvidence.policyDigest === policy.policyDigest &&
        frozenEvidence.imageDigest === policy.imageDigest &&
        sameManagedSandboxResourceBudget(frozenEvidence.observedBudget, policy.resourceBudget) &&
        admissionControls.every((control) => controls[control] === "attested") &&
        input.authority.verify({ evidence: frozenEvidence, policy });
      if (!matchesPolicy) throw new ManagedSandboxEvidenceVerificationError();
      const result: ManagedSandboxVerifiedEvidence = Object.freeze({ ...frozenEvidence, proofState: "verified", verifiedAt: now.toISOString() });
      verifiedEvidence.add(result);
      return result;
    },
  };
}

function freezeManagedSandboxEvidencePolicy(value: ManagedSandboxEvidencePolicy): ManagedSandboxEvidencePolicy {
  return Object.freeze({
    providerId: value.providerId,
    adapterVersion: value.adapterVersion,
    accountScopeDigest: value.accountScopeDigest,
    projectScopeDigest: value.projectScopeDigest,
    configurationDigest: value.configurationDigest,
    policyDigest: value.policyDigest,
    imageDigest: value.imageDigest,
    requiredCapabilities: Object.freeze([...value.requiredCapabilities]),
    resourceBudget: freezeManagedSandboxResourceBudget(value.resourceBudget),
  });
}

export function assertManagedSandboxVerifiedEvidence(value: unknown): asserts value is ManagedSandboxVerifiedEvidence {
  if (value === null || typeof value !== "object" || !verifiedEvidence.has(value)) throw new ManagedSandboxEvidenceVerificationError();
}

function validatePolicy(policy: ManagedSandboxEvidencePolicy): void {
  const capabilities = new Set(policy.requiredCapabilities);
  const exactCapabilities = policy.requiredCapabilities.length === REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES.length &&
    capabilities.size === REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES.length &&
    REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES.every((capability) => capabilities.has(capability));
  if (!opaque.test(policy.providerId) || !opaque.test(policy.adapterVersion) || !digest.test(policy.accountScopeDigest) || !digest.test(policy.projectScopeDigest) || !digest.test(policy.configurationDigest) || !digest.test(policy.policyDigest) || !digest.test(policy.imageDigest) || !exactCapabilities || !isManagedSandboxResourceBudget(policy.resourceBudget)) throw new ManagedSandboxEvidenceVerificationError();
}
