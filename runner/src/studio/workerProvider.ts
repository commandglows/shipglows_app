import { createHash, timingSafeEqual } from "node:crypto";

import { isStudioDigest, isStudioRevision, type CompileIntent } from "./contracts.js";
import {
  type ManagedSandboxCapabilityAttestation,
  freezeManagedSandboxCapabilityAttestation,
} from "./providers/attestation.js";
import { type ManagedSandboxEvidenceVerifier, type ManagedSandboxVerifiedEvidence } from "./providers/evidenceVerifier.js";
import {
  REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES,
  type ManagedSandboxCapability,
  type ManagedSandboxResourceBudget,
  type ManagedSandboxUnavailableReason,
  freezeManagedSandboxResourceBudget,
  isManagedSandboxResourceBudget,
} from "./providers/managedSandbox.js";

export const REQUIRED_STUDIO_WORKER_CAPABILITIES = REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES;

export type StudioWorkerCapability = ManagedSandboxCapability;
export type StudioWorkerPhase = "generation" | "verification";

export interface StudioWorkerAdmissionRequest {
  readonly jobId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly actorId: string;
  readonly intentId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly imageDigest: string;
  readonly policyDigest: string;
  readonly phase: StudioWorkerPhase;
  readonly expiresAt: string;
  readonly idempotencyKey: string;
  /** Present for every admission constructed by this service. Optional only while a provider adapter migrates its preflight input type. */
  readonly resourceBudget?: ManagedSandboxResourceBudget;
  /** Compatibility aliases for provider adapters; admission requires and validates resourceBudget. */
  readonly maxDurationMs: number;
  /** Compatibility aliases for provider adapters; admission requires and validates resourceBudget. */
  readonly maxMemoryBytes: number;
  /** Compatibility aliases for provider adapters; admission requires and validates resourceBudget. */
  readonly maxProcesses: number;
  readonly outboundNetwork: "gatewayOnly" | "denied";
  readonly modelGatewayCapability: "singleJob" | "none";
}

export interface StudioWorkerAttestation {
  readonly providerId: string;
  readonly workerIdentity: string;
  readonly imageDigest: string;
  readonly policyDigest: string;
  readonly capabilities: readonly StudioWorkerCapability[];
  readonly phase: StudioWorkerPhase;
  readonly expiresAt: string;
  /** Provider-reported evidence remains untrusted until the injected verifier accepts the complete attestation. */
  readonly managedSandbox: ManagedSandboxCapabilityAttestation;
}

export interface StudioWorkerProvider {
  readonly providerId: string;
  preflight(request: StudioWorkerAdmissionRequest): Promise<{ readonly available: true; readonly attestation: StudioWorkerAttestation } | { readonly available: false; readonly reason: ManagedSandboxUnavailableReason }>;
  release?(request: StudioWorkerAdmissionRequest, attestation: StudioWorkerAttestation | undefined, reason: "preflightUnavailable" | "preflightTimedOut" | "attestationRejected"): Promise<void>;
}

export class StudioCompileAdmissionError extends Error {
  constructor(readonly code: "workerUnavailable" | "workerIncompatible" | "invalidEnvelope" | "expiredEnvelope", message: string) {
    super(message);
    this.name = "StudioCompileAdmissionError";
  }
}

const opaque = /^[A-Za-z0-9._:-]{1,128}$/;
const imageDigestPattern = /^sha256:[a-f0-9]{64}$/;

export class StudioCompileAdmissionService {
  readonly #preflightTimeoutMs: number;
  readonly #evidenceVerifier: ManagedSandboxEvidenceVerifier | undefined;
  readonly #policy: { readonly imageDigest: string; readonly policyDigest: string; readonly resourceBudget: ManagedSandboxResourceBudget };

  constructor(
    private readonly provider: StudioWorkerProvider | undefined,
    policy: { readonly imageDigest: string; readonly policyDigest: string; readonly resourceBudget: ManagedSandboxResourceBudget },
    private readonly now: () => Date = () => new Date(),
    options: { readonly preflightTimeoutMs?: number; readonly evidenceVerifier?: ManagedSandboxEvidenceVerifier } = {},
  ) {
    this.#policy = Object.freeze({ imageDigest: policy.imageDigest, policyDigest: policy.policyDigest, resourceBudget: freezeManagedSandboxResourceBudget(policy.resourceBudget) });
    this.#preflightTimeoutMs = options.preflightTimeoutMs ?? 15_000;
    this.#evidenceVerifier = options.evidenceVerifier;
  }

  async admit(input: { readonly tenantId: string; readonly projectId: string; readonly actorId: string; readonly intent: CompileIntent }): Promise<StudioWorkerAttestation> {
    if (this.provider === undefined || this.#evidenceVerifier === undefined) throw new StudioCompileAdmissionError("workerUnavailable", "Dedicated Studio worker is unavailable.");
    if (!imageDigestPattern.test(this.#policy.imageDigest) || !isStudioDigest(this.#policy.policyDigest) || !isStudioRevision(input.intent.sourceCommit) || !isStudioDigest(input.intent.repositoryDigest)) throw new StudioCompileAdmissionError("invalidEnvelope", "Studio compile policy is invalid.");
    const expiresAt = new Date(this.now().getTime() + Math.min(this.#policy.resourceBudget.maxDurationMs, 15 * 60 * 1000)).toISOString();
    const request: StudioWorkerAdmissionRequest = {
      jobId: `job_${createHash("sha256").update(`${input.tenantId}:${input.intent.intentId}`).digest("hex").slice(0, 24)}`,
      tenantId: input.tenantId,
      projectId: input.projectId,
      actorId: input.actorId,
      intentId: input.intent.intentId,
      sourceRevision: input.intent.sourceCommit,
      repositoryDigest: input.intent.repositoryDigest,
      imageDigest: this.#policy.imageDigest,
      policyDigest: this.#policy.policyDigest,
      phase: "generation",
      expiresAt,
      idempotencyKey: input.intent.idempotencyKey,
      resourceBudget: this.#policy.resourceBudget,
      maxDurationMs: this.#policy.resourceBudget.maxDurationMs,
      maxMemoryBytes: this.#policy.resourceBudget.maxMemoryBytes,
      maxProcesses: this.#policy.resourceBudget.maxProcesses,
      outboundNetwork: "gatewayOnly",
      modelGatewayCapability: "singleJob",
    };
    validateWorkerRequest(request, this.now());
    const frozenRequest = freezeStudioWorkerAdmissionRequest(request);
    const preflight = this.provider.preflight(frozenRequest);
    let result: Awaited<ReturnType<StudioWorkerProvider["preflight"]>>;
    try {
      result = await boundedWorkerPreflight(preflight, this.#preflightTimeoutMs);
    } catch {
      void preflight.then((late) => this.release(frozenRequest, late.available ? late.attestation : undefined, "preflightTimedOut")).catch(() => undefined);
      await this.release(frozenRequest, undefined, "preflightTimedOut");
      throw new StudioCompileAdmissionError("workerUnavailable", "Dedicated Studio worker preflight timed out.");
    }
    if (!result.available) {
      await this.release(frozenRequest, undefined, "preflightUnavailable");
      throw new StudioCompileAdmissionError("workerUnavailable", "Dedicated Studio worker is unavailable.");
    }
    try {
      validateWorkerAttestation(result.attestation, request, this.provider.providerId, this.#evidenceVerifier, this.now());
    } catch (error) {
      await this.release(frozenRequest, result.attestation, "attestationRejected");
      throw error;
    }
    return freezeStudioWorkerAttestation(result.attestation);
  }

  private async release(request: StudioWorkerAdmissionRequest, attestation: StudioWorkerAttestation | undefined, reason: "preflightUnavailable" | "preflightTimedOut" | "attestationRejected"): Promise<void> {
    try { await this.provider?.release?.(request, attestation === undefined ? undefined : freezeStudioWorkerAttestation(attestation), reason); } catch { /* release uncertainty remains fail-closed */ }
  }
}

async function boundedWorkerPreflight<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("timeout")), timeoutMs); })]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function validateWorkerRequest(request: StudioWorkerAdmissionRequest, now = new Date()): void {
  for (const value of [request.jobId, request.tenantId, request.projectId, request.actorId, request.intentId, request.idempotencyKey]) if (!opaque.test(value)) throw new StudioCompileAdmissionError("invalidEnvelope", "Worker envelope contains an invalid opaque identifier.");
  if (!isStudioRevision(request.sourceRevision) || !isStudioDigest(request.repositoryDigest) || !imageDigestPattern.test(request.imageDigest) || !isStudioDigest(request.policyDigest)) throw new StudioCompileAdmissionError("invalidEnvelope", "Worker envelope contains an invalid immutable identity.");
  const expiry = Date.parse(request.expiresAt);
  if (!Number.isFinite(expiry) || expiry <= now.getTime() || expiry - now.getTime() > 15 * 60 * 1000) throw new StudioCompileAdmissionError("expiredEnvelope", "Worker envelope expiry is invalid.");
  if (request.resourceBudget === undefined || !isManagedSandboxResourceBudget(request.resourceBudget) || request.maxDurationMs !== request.resourceBudget.maxDurationMs || request.maxMemoryBytes !== request.resourceBudget.maxMemoryBytes || request.maxProcesses !== request.resourceBudget.maxProcesses) throw new StudioCompileAdmissionError("invalidEnvelope", "Worker resource budget is invalid.");
  if (request.phase === "generation" && (request.outboundNetwork !== "gatewayOnly" || request.modelGatewayCapability !== "singleJob")) throw new StudioCompileAdmissionError("invalidEnvelope", "Generation phase must use only the model gateway capability.");
  if (request.phase === "generation" && (request.resourceBudget.maxModelTokens < 1 || request.resourceBudget.spendReservation.amountMicros < 1)) throw new StudioCompileAdmissionError("invalidEnvelope", "Generation phase requires a bounded model and spend reservation.");
  if (request.phase === "verification" && (request.outboundNetwork !== "denied" || request.modelGatewayCapability !== "none" || request.resourceBudget.maxModelTokens !== 0)) throw new StudioCompileAdmissionError("invalidEnvelope", "Verification phase must deny network and model capability.");
}

export function validateWorkerAttestation(attestation: StudioWorkerAttestation, request: StudioWorkerAdmissionRequest, expectedProviderId: string, evidenceVerifier: ManagedSandboxEvidenceVerifier, now = new Date()): void {
  const exact = attestation.providerId === expectedProviderId && opaque.test(attestation.workerIdentity) &&
    equalText(attestation.imageDigest, request.imageDigest) && equalText(attestation.policyDigest, request.policyDigest) &&
    attestation.phase === request.phase && attestation.expiresAt === request.expiresAt && Date.parse(attestation.expiresAt) > now.getTime();
  const capabilities = new Set(attestation.capabilities);
  let verifiedEvidence: ManagedSandboxVerifiedEvidence;
  try {
    verifiedEvidence = evidenceVerifier.verify(attestation.managedSandbox, now);
  } catch {
    throw new StudioCompileAdmissionError("workerIncompatible", "Dedicated Studio worker attestation is incompatible.");
  }
  const evidenceBound = equalText(verifiedEvidence.observedResourceIdentityDigest, digestText(attestation.workerIdentity)) &&
    equalText(verifiedEvidence.scenarioDigest, studioWorkerScenarioDigest(request)) &&
    verifiedEvidence.expiresAt === attestation.expiresAt;
  if (!exact || !evidenceBound || attestation.capabilities.length !== REQUIRED_STUDIO_WORKER_CAPABILITIES.length || capabilities.size !== REQUIRED_STUDIO_WORKER_CAPABILITIES.length || REQUIRED_STUDIO_WORKER_CAPABILITIES.some((item) => !capabilities.has(item))) throw new StudioCompileAdmissionError("workerIncompatible", "Dedicated Studio worker attestation is incompatible.");
}

/** Canonical digest binding every immutable admission input to one evidence scenario. */
export function studioWorkerScenarioDigest(request: StudioWorkerAdmissionRequest): string {
  const budget = request.resourceBudget;
  return digestText(JSON.stringify([
    request.jobId, request.tenantId, request.projectId, request.actorId, request.intentId,
    request.sourceRevision, request.repositoryDigest, request.imageDigest, request.policyDigest,
    request.phase, request.expiresAt, request.idempotencyKey,
    budget === undefined ? null : [
      budget.maxDurationMs, budget.maxVcpus, budget.maxMemoryBytes, budget.maxDiskBytes,
      budget.maxProcesses, budget.maxOutputBytes, budget.maxConcurrentAllocations,
      budget.maxProviderApiCalls, budget.providerApiWindowMs, budget.maxTransferBytes,
      budget.maxModelTokens, budget.spendReservation.currency,
      budget.spendReservation.amountMicros, budget.spendReservation.reservationId,
    ],
    request.maxDurationMs, request.maxMemoryBytes, request.maxProcesses,
    request.outboundNetwork, request.modelGatewayCapability,
  ]));
}

function digestText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function equalText(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function freezeStudioWorkerAdmissionRequest(value: StudioWorkerAdmissionRequest): StudioWorkerAdmissionRequest {
  return Object.freeze({
    jobId: value.jobId,
    tenantId: value.tenantId,
    projectId: value.projectId,
    actorId: value.actorId,
    intentId: value.intentId,
    sourceRevision: value.sourceRevision,
    repositoryDigest: value.repositoryDigest,
    imageDigest: value.imageDigest,
    policyDigest: value.policyDigest,
    phase: value.phase,
    expiresAt: value.expiresAt,
    idempotencyKey: value.idempotencyKey,
    ...(value.resourceBudget === undefined ? {} : { resourceBudget: freezeManagedSandboxResourceBudget(value.resourceBudget) }),
    maxDurationMs: value.maxDurationMs,
    maxMemoryBytes: value.maxMemoryBytes,
    maxProcesses: value.maxProcesses,
    outboundNetwork: value.outboundNetwork,
    modelGatewayCapability: value.modelGatewayCapability,
  });
}

function freezeStudioWorkerAttestation(value: StudioWorkerAttestation): StudioWorkerAttestation {
  return Object.freeze({
    providerId: value.providerId,
    workerIdentity: value.workerIdentity,
    imageDigest: value.imageDigest,
    policyDigest: value.policyDigest,
    capabilities: Object.freeze([...value.capabilities]),
    phase: value.phase,
    expiresAt: value.expiresAt,
    managedSandbox: freezeManagedSandboxCapabilityAttestation(value.managedSandbox),
  });
}
