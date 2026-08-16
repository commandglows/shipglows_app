import { createHash, timingSafeEqual } from "node:crypto";

import { isStudioDigest, isStudioRevision, type CompileIntent } from "./contracts.js";

export const REQUIRED_STUDIO_WORKER_CAPABILITIES = Object.freeze([
  "dedicatedFailureDomain",
  "containerd2",
  "gvisorRunsc",
  "systrap",
  "nonRoot",
  "readOnlyRootFilesystem",
  "noHostMounts",
  "noRuntimeSocket",
  "networkDeniedByDefault",
  "freshGenerationSandbox",
  "freshVerificationSandbox",
  "phaseCredentialSeparation",
  "immutableImage",
  "signedSingleJobEnvelope",
  "resourceQuotas",
  "expiringLease",
  "restartReconciliation",
] as const);

export type StudioWorkerCapability = (typeof REQUIRED_STUDIO_WORKER_CAPABILITIES)[number];
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
  readonly maxDurationMs: number;
  readonly maxMemoryBytes: number;
  readonly maxProcesses: number;
  readonly outboundNetwork: "gatewayOnly" | "denied";
  readonly modelGatewayCapability: "singleJob" | "none";
}

export interface StudioWorkerAttestation {
  readonly providerId: string;
  readonly workerIdentity: string;
  readonly runtimeClass: string;
  readonly platform: string;
  readonly imageDigest: string;
  readonly policyDigest: string;
  readonly capabilities: readonly StudioWorkerCapability[];
  readonly phase: StudioWorkerPhase;
  readonly expiresAt: string;
}

export interface StudioWorkerProvider {
  readonly providerId: string;
  preflight(request: StudioWorkerAdmissionRequest): Promise<{ readonly available: true; readonly attestation: StudioWorkerAttestation } | { readonly available: false; readonly reason: string }>;
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

  constructor(
    private readonly provider: StudioWorkerProvider | undefined,
    private readonly policy: { readonly imageDigest: string; readonly policyDigest: string; readonly maxDurationMs: number; readonly maxMemoryBytes: number; readonly maxProcesses: number },
    private readonly now: () => Date = () => new Date(),
    options: { readonly preflightTimeoutMs?: number } = {},
  ) { this.#preflightTimeoutMs = options.preflightTimeoutMs ?? 15_000; }

  async admit(input: { readonly tenantId: string; readonly projectId: string; readonly actorId: string; readonly intent: CompileIntent }): Promise<StudioWorkerAttestation> {
    if (this.provider === undefined) throw new StudioCompileAdmissionError("workerUnavailable", "Dedicated Studio worker is unavailable.");
    if (!imageDigestPattern.test(this.policy.imageDigest) || !isStudioDigest(this.policy.policyDigest) || !isStudioRevision(input.intent.sourceCommit) || !isStudioDigest(input.intent.repositoryDigest)) throw new StudioCompileAdmissionError("invalidEnvelope", "Studio compile policy is invalid.");
    const expiresAt = new Date(this.now().getTime() + Math.min(this.policy.maxDurationMs, 15 * 60 * 1000)).toISOString();
    const request: StudioWorkerAdmissionRequest = {
      jobId: `job_${createHash("sha256").update(`${input.tenantId}:${input.intent.intentId}`).digest("hex").slice(0, 24)}`,
      tenantId: input.tenantId,
      projectId: input.projectId,
      actorId: input.actorId,
      intentId: input.intent.intentId,
      sourceRevision: input.intent.sourceCommit,
      repositoryDigest: input.intent.repositoryDigest,
      imageDigest: this.policy.imageDigest,
      policyDigest: this.policy.policyDigest,
      phase: "generation",
      expiresAt,
      idempotencyKey: input.intent.idempotencyKey,
      maxDurationMs: this.policy.maxDurationMs,
      maxMemoryBytes: this.policy.maxMemoryBytes,
      maxProcesses: this.policy.maxProcesses,
      outboundNetwork: "gatewayOnly",
      modelGatewayCapability: "singleJob",
    };
    validateWorkerRequest(request, this.now());
    const frozenRequest = Object.freeze(request);
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
      throw new StudioCompileAdmissionError("workerUnavailable", `Dedicated Studio worker is unavailable: ${result.reason}.`);
    }
    try {
      validateWorkerAttestation(result.attestation, request, this.provider.providerId, this.now());
    } catch (error) {
      await this.release(frozenRequest, result.attestation, "attestationRejected");
      throw error;
    }
    return result.attestation;
  }

  private async release(request: StudioWorkerAdmissionRequest, attestation: StudioWorkerAttestation | undefined, reason: "preflightUnavailable" | "preflightTimedOut" | "attestationRejected"): Promise<void> {
    try { await this.provider?.release?.(request, attestation, reason); } catch { /* release uncertainty remains fail-closed */ }
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
  if (!Number.isSafeInteger(request.maxDurationMs) || request.maxDurationMs < 1_000 || request.maxDurationMs > 15 * 60 * 1000 || !Number.isSafeInteger(request.maxMemoryBytes) || request.maxMemoryBytes < 64 * 1024 * 1024 || request.maxMemoryBytes > 4 * 1024 * 1024 * 1024 || !Number.isSafeInteger(request.maxProcesses) || request.maxProcesses < 1 || request.maxProcesses > 256) throw new StudioCompileAdmissionError("invalidEnvelope", "Worker resource budget is invalid.");
  if (request.phase === "verification" && (request.outboundNetwork !== "denied" || request.modelGatewayCapability !== "none")) throw new StudioCompileAdmissionError("invalidEnvelope", "Verification phase must deny network and model capability.");
}

export function validateWorkerAttestation(attestation: StudioWorkerAttestation, request: StudioWorkerAdmissionRequest, expectedProviderId: string, now = new Date()): void {
  const exact = attestation.providerId === expectedProviderId && opaque.test(attestation.workerIdentity) &&
    attestation.runtimeClass === "io.containerd.runsc.v1" && attestation.platform === "systrap" &&
    equalText(attestation.imageDigest, request.imageDigest) && equalText(attestation.policyDigest, request.policyDigest) &&
    attestation.phase === request.phase && attestation.expiresAt === request.expiresAt && Date.parse(attestation.expiresAt) > now.getTime();
  const capabilities = new Set(attestation.capabilities);
  if (!exact || capabilities.size !== REQUIRED_STUDIO_WORKER_CAPABILITIES.length || REQUIRED_STUDIO_WORKER_CAPABILITIES.some((item) => !capabilities.has(item))) throw new StudioCompileAdmissionError("workerIncompatible", "Dedicated Studio worker attestation is incompatible.");
}

function equalText(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}
