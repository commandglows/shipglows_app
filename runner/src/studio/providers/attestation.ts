import {
  MANAGED_SANDBOX_CONTROL_NAMES,
  type ManagedSandboxControl,
  type ManagedSandboxControlState,
  type ManagedSandboxResourceBudget,
  freezeManagedSandboxResourceBudget,
} from "./managedSandbox.js";

export const MANAGED_SANDBOX_ATTESTATION_VERSION = "shipglows.managed-sandbox.v1" as const;

export interface ManagedSandboxCapabilityAttestation {
  readonly version: typeof MANAGED_SANDBOX_ATTESTATION_VERSION;
  readonly providerId: string;
  readonly adapterVersion: string;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  /** Provider report only; admission requires the complete observed-evidence form below. */
  readonly observedResourceIdentityDigest?: string;
  readonly configurationDigest?: string;
  readonly policyDigest?: string;
  readonly imageDigest?: string;
  readonly scenarioDigest?: string;
  readonly evidenceDigest?: string;
  readonly proofState?: "observed" | "unproved";
  readonly observedBudget?: ManagedSandboxResourceBudget;
  readonly observedAt: string;
  readonly expiresAt: string;
  readonly controls: Readonly<Record<ManagedSandboxControl, ManagedSandboxControlState>>;
  readonly testedScenarios: readonly string[];
  readonly invalidationConditions: readonly string[];
}

export type ManagedSandboxObservedEvidence = ManagedSandboxCapabilityAttestation & Required<Pick<ManagedSandboxCapabilityAttestation,
  "observedResourceIdentityDigest" | "configurationDigest" | "policyDigest" | "imageDigest" | "scenarioDigest" |
  "evidenceDigest" | "proofState" | "observedBudget"
>>;

export class ManagedSandboxAttestationError extends Error {
  constructor() {
    super("Managed sandbox capability attestation is incompatible.");
    this.name = "ManagedSandboxAttestationError";
  }
}

const opaque = /^[A-Za-z0-9._:-]{1,128}$/;
const digest = /^[a-f0-9]{64}$/;
const state = new Set<ManagedSandboxControlState>(["attested", "unproved", "unavailable", "notImplemented"]);
const admissionControls: readonly ManagedSandboxControl[] = ["lifecycle", "network", "credentials", "quotas", "cleanup"];

export function validateManagedSandboxAttestation(
  attestation: ManagedSandboxCapabilityAttestation,
  input: { readonly expectedProviderId: string; readonly now?: Date },
): asserts attestation is ManagedSandboxObservedEvidence {
  const now = input.now ?? new Date();
  if (!hasObservedEvidence(attestation)) throw new ManagedSandboxAttestationError();
  const untrusted = attestation as { readonly version: string };
  const observed = Date.parse(attestation.observedAt);
  const expires = Date.parse(attestation.expiresAt);
  const controls = attestation.controls as Record<string, unknown>;
  const exactControls = Object.keys(controls).length === MANAGED_SANDBOX_CONTROL_NAMES.length &&
    MANAGED_SANDBOX_CONTROL_NAMES.every((name) => state.has(controls[name] as ManagedSandboxControlState));
  const scenarios = validCodes(attestation.testedScenarios, 1, 32);
  const invalidation = validCodes(attestation.invalidationConditions, 1, 16);
  const requiredControlsAttested = admissionControls.every((name) => controls[name] === "attested");
  if (
    untrusted.version !== MANAGED_SANDBOX_ATTESTATION_VERSION ||
    attestation.providerId !== input.expectedProviderId ||
    !opaque.test(attestation.providerId) ||
    !opaque.test(attestation.adapterVersion) ||
    !digest.test(attestation.accountScopeDigest) ||
    !digest.test(attestation.projectScopeDigest) ||
    !digest.test(attestation.observedResourceIdentityDigest) ||
    !digest.test(attestation.configurationDigest) ||
    !digest.test(attestation.policyDigest) ||
    !digest.test(attestation.imageDigest) ||
    !digest.test(attestation.scenarioDigest) ||
    !digest.test(attestation.evidenceDigest) ||
    !Number.isFinite(observed) ||
    !Number.isFinite(expires) ||
    observed > now.getTime() ||
    expires <= now.getTime() ||
    expires - observed > 24 * 60 * 60 * 1000 ||
    !exactControls ||
    !scenarios ||
    !invalidation ||
    !requiredControlsAttested
  ) throw new ManagedSandboxAttestationError();
}

/** Clone and deeply freeze untrusted evidence before passing it to a verifier or caller. */
export function freezeManagedSandboxCapabilityAttestation(value: ManagedSandboxCapabilityAttestation): ManagedSandboxCapabilityAttestation {
  return Object.freeze({
    version: value.version,
    providerId: value.providerId,
    adapterVersion: value.adapterVersion,
    accountScopeDigest: value.accountScopeDigest,
    projectScopeDigest: value.projectScopeDigest,
    ...(value.observedResourceIdentityDigest === undefined ? {} : { observedResourceIdentityDigest: value.observedResourceIdentityDigest }),
    ...(value.configurationDigest === undefined ? {} : { configurationDigest: value.configurationDigest }),
    ...(value.policyDigest === undefined ? {} : { policyDigest: value.policyDigest }),
    ...(value.imageDigest === undefined ? {} : { imageDigest: value.imageDigest }),
    ...(value.scenarioDigest === undefined ? {} : { scenarioDigest: value.scenarioDigest }),
    ...(value.evidenceDigest === undefined ? {} : { evidenceDigest: value.evidenceDigest }),
    ...(value.proofState === undefined ? {} : { proofState: value.proofState }),
    ...(value.observedBudget === undefined ? {} : { observedBudget: freezeManagedSandboxResourceBudget(value.observedBudget) }),
    observedAt: value.observedAt,
    expiresAt: value.expiresAt,
    controls: Object.freeze({ ...value.controls }),
    testedScenarios: Object.freeze([...value.testedScenarios]),
    invalidationConditions: Object.freeze([...value.invalidationConditions]),
  });
}

function hasObservedEvidence(value: ManagedSandboxCapabilityAttestation): value is ManagedSandboxObservedEvidence {
  return typeof value.observedResourceIdentityDigest === "string" && typeof value.configurationDigest === "string" &&
    typeof value.policyDigest === "string" && typeof value.imageDigest === "string" && typeof value.scenarioDigest === "string" &&
    typeof value.evidenceDigest === "string" && (value.proofState === "observed" || value.proofState === "unproved") &&
    value.observedBudget !== undefined;
}

function validCodes(values: readonly string[], minimum: number, maximum: number): boolean {
  return values.length >= minimum && values.length <= maximum && new Set(values).size === values.length && values.every((value) => opaque.test(value));
}
