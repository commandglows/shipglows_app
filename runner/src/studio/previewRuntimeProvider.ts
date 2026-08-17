import { isStudioDigest, isStudioRevision } from "./contracts.js";
import { isExactStudioOrigin } from "./capability.js";
import { studioProfileForId } from "./profiles.js";

export interface PreviewRuntimeRequest {
  readonly profileId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly generated: boolean;
}

export interface PreviewRuntimeProvider {
  readonly providerId: string;
  readonly capabilities: {
    readonly basePreview: boolean;
    readonly generatedPreview: boolean;
    readonly networkDenied: boolean;
    readonly hostExecutionDenied: boolean;
  };
  preflight(request: PreviewRuntimeRequest): Promise<{ readonly available: true; readonly admissionId: string; readonly sourceRevision: string; readonly repositoryDigest: string } | { readonly available: false; readonly reason: string }>;
  start(request: PreviewRuntimeRequest & { readonly admissionId: string }): Promise<{ readonly runtimeId: string; readonly origin: string; readonly sourceRevision: string; readonly repositoryDigest: string }>;
  health(runtimeId: string): Promise<{ readonly healthy: boolean; readonly reason?: string; readonly sourceRevision?: string; readonly repositoryDigest?: string }>;
  interrupt(runtimeId: string, reason: string): Promise<void>;
  stop(runtimeId: string): Promise<void>;
  cleanup(runtimeId: string): Promise<void>;
}

export class PreviewRuntimeAdmissionError extends Error {
  constructor(readonly code: "invalidRequest" | "providerUnavailable" | "profileMismatch" | "runtimeMismatch" | "timeout" | "alreadyStarted", message: string) {
    super(message);
    this.name = "PreviewRuntimeAdmissionError";
  }
}

async function bounded<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new PreviewRuntimeAdmissionError("timeout", "Preview runtime operation timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export class PreviewRuntimeController {
  readonly #provider: PreviewRuntimeProvider;
  readonly #timeoutMs: number;
  #runtimeId: string | undefined;
  #cleaned = false;

  constructor(provider: PreviewRuntimeProvider, options: { readonly timeoutMs?: number } = {}) {
    this.#provider = provider;
    this.#timeoutMs = options.timeoutMs ?? 15_000;
  }

  async start(request: PreviewRuntimeRequest): Promise<{ readonly runtimeId: string; readonly origin: string; readonly sourceRevision: string; readonly repositoryDigest: string }> {
    if (this.#runtimeId !== undefined) throw new PreviewRuntimeAdmissionError("alreadyStarted", "Preview runtime is already started.");
    const profile = studioProfileForId(request.profileId);
    if (profile === null || !isStudioRevision(request.sourceRevision) || !isStudioDigest(request.repositoryDigest)) throw new PreviewRuntimeAdmissionError("invalidRequest", "Preview runtime request is invalid.");
    if (!this.#provider.capabilities.networkDenied || !this.#provider.capabilities.hostExecutionDenied) throw new PreviewRuntimeAdmissionError("providerUnavailable", "Preview provider isolation is unavailable.");
    if (request.generated && !this.#provider.capabilities.generatedPreview) throw new PreviewRuntimeAdmissionError("providerUnavailable", "Generated preview isolation is unavailable.");
    if (!request.generated && !this.#provider.capabilities.basePreview) throw new PreviewRuntimeAdmissionError("providerUnavailable", "Base preview is unavailable.");
    const admission = await bounded(this.#provider.preflight(request), this.#timeoutMs);
    if (!admission.available) throw new PreviewRuntimeAdmissionError("providerUnavailable", `Preview provider unavailable: ${admission.reason}.`);
    if (admission.sourceRevision !== request.sourceRevision || admission.repositoryDigest !== request.repositoryDigest) throw new PreviewRuntimeAdmissionError("profileMismatch", "Preview admission does not match the requested repository identity.");
    let runtime: Awaited<ReturnType<PreviewRuntimeProvider["start"]>>;
    const startOperation = this.#provider.start({ ...request, admissionId: admission.admissionId });
    try {
      runtime = await bounded(startOperation, this.#timeoutMs);
    } catch (error) {
      void startOperation.then((lateRuntime) => this.safeCleanup(lateRuntime.runtimeId)).catch(() => undefined);
      throw error instanceof PreviewRuntimeAdmissionError ? error : new PreviewRuntimeAdmissionError("providerUnavailable", "Preview runtime failed to start.");
    }
    if (!isExactStudioOrigin(runtime.origin) || runtime.origin !== profile.previewOrigin || runtime.sourceRevision !== request.sourceRevision || runtime.repositoryDigest !== request.repositoryDigest) {
      await this.safeCleanup(runtime.runtimeId);
      throw new PreviewRuntimeAdmissionError("runtimeMismatch", "Preview runtime attestation does not match the admitted profile.");
    }
    let health: Awaited<ReturnType<PreviewRuntimeProvider["health"]>>;
    try {
      health = await bounded(this.#provider.health(runtime.runtimeId), this.#timeoutMs);
    } catch (error) {
      await this.safeCleanup(runtime.runtimeId);
      throw error instanceof PreviewRuntimeAdmissionError ? error : new PreviewRuntimeAdmissionError("providerUnavailable", "Preview runtime health check failed.");
    }
    if (!health.healthy || health.sourceRevision !== request.sourceRevision || health.repositoryDigest !== request.repositoryDigest) {
      await this.safeCleanup(runtime.runtimeId);
      throw new PreviewRuntimeAdmissionError("runtimeMismatch", "Preview runtime did not become healthy with the admitted repository identity.");
    }
    this.#runtimeId = runtime.runtimeId;
    this.#cleaned = false;
    return runtime;
  }

  async health(): Promise<{ readonly healthy: boolean; readonly reason?: string; readonly sourceRevision?: string; readonly repositoryDigest?: string }> {
    if (this.#runtimeId === undefined) return { healthy: false, reason: "notStarted" };
    return bounded(this.#provider.health(this.#runtimeId), this.#timeoutMs);
  }

  async interrupt(reason: string): Promise<void> {
    if (this.#runtimeId !== undefined) await bounded(this.#provider.interrupt(this.#runtimeId, reason), this.#timeoutMs);
  }

  async stop(): Promise<void> {
    if (this.#runtimeId !== undefined) await bounded(this.#provider.stop(this.#runtimeId), this.#timeoutMs);
  }

  async cleanup(): Promise<void> {
    if (this.#runtimeId === undefined || this.#cleaned) return;
    await bounded(this.#provider.cleanup(this.#runtimeId), this.#timeoutMs);
    this.#cleaned = true;
    this.#runtimeId = undefined;
  }

  private async safeCleanup(runtimeId: string): Promise<void> {
    try { await bounded(this.#provider.cleanup(runtimeId), this.#timeoutMs); } catch { /* cleanup uncertainty stays unavailable */ }
  }
}
