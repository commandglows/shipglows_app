export interface PreviewRuntimeRequest {
  readonly profileId: string;
  readonly sourceRevision: string;
  readonly generated: boolean;
}

export interface PreviewRuntimeProvider {
  readonly providerId: string;
  readonly capabilities: { readonly basePreview: boolean; readonly generatedPreview: boolean; readonly networkDenied: boolean };
  preflight(request: PreviewRuntimeRequest): Promise<{ readonly available: true; readonly admissionId: string } | { readonly available: false; readonly reason: string }>;
  start(request: PreviewRuntimeRequest & { readonly admissionId: string }): Promise<{ readonly runtimeId: string; readonly origin: string }>;
  health(runtimeId: string): Promise<{ readonly healthy: boolean; readonly reason?: string }>;
  interrupt(runtimeId: string, reason: string): Promise<void>;
  stop(runtimeId: string): Promise<void>;
  cleanup(runtimeId: string): Promise<void>;
}

export class PreviewRuntimeAdmissionError extends Error {
  constructor(message: string) { super(message); this.name = "PreviewRuntimeAdmissionError"; }
}

export class PreviewRuntimeController {
  readonly #provider: PreviewRuntimeProvider;
  #runtimeId: string | undefined;
  #cleaned = false;

  constructor(provider: PreviewRuntimeProvider) { this.#provider = provider; }

  async start(request: PreviewRuntimeRequest): Promise<{ readonly runtimeId: string; readonly origin: string }> {
    if (!this.#provider.capabilities.networkDenied) throw new PreviewRuntimeAdmissionError("Preview provider does not deny outbound network.");
    if (request.generated && !this.#provider.capabilities.generatedPreview) throw new PreviewRuntimeAdmissionError("Generated preview isolation is unavailable.");
    if (!request.generated && !this.#provider.capabilities.basePreview) throw new PreviewRuntimeAdmissionError("Base preview is unavailable.");
    const admission = await this.#provider.preflight(request);
    if (!admission.available) throw new PreviewRuntimeAdmissionError(`Preview provider unavailable: ${admission.reason}.`);
    const runtime = await this.#provider.start({ ...request, admissionId: admission.admissionId });
    this.#runtimeId = runtime.runtimeId;
    return runtime;
  }

  async health(): Promise<{ readonly healthy: boolean; readonly reason?: string }> {
    if (!this.#runtimeId) return { healthy: false, reason: "notStarted" };
    return this.#provider.health(this.#runtimeId);
  }

  async interrupt(reason: string): Promise<void> { if (this.#runtimeId) await this.#provider.interrupt(this.#runtimeId, reason); }
  async stop(): Promise<void> { if (this.#runtimeId) await this.#provider.stop(this.#runtimeId); }
  async cleanup(): Promise<void> {
    if (!this.#runtimeId || this.#cleaned) return;
    await this.#provider.cleanup(this.#runtimeId);
    this.#cleaned = true;
  }
}
