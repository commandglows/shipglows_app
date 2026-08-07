import { randomUUID } from "node:crypto";

import {
  type ExecutionCapability,
  type ExecutionIntentTrigger,
  type ExecutionOutcome,
  type ExecutionProvider,
  type ExecutionProviderRegistry,
  type OpaqueId,
  type ResolvedExecutionEnvelope,
  ExecutionProviderError,
} from "../contracts/index.js";

export interface ExecutionAdmissionStore {
  createExecution(input: ResolvedExecutionEnvelope): void;
  markExecution(input: { readonly tenantId: string; readonly executionId: string; readonly state: "preflightPassed" | "completed" | "interrupted" | "failed"; readonly failureCode?: string }): void;
  markExecutionForRun(input: { readonly tenantId: string; readonly runId: string; readonly state: "completed" | "interrupted" | "failed"; readonly failureCode?: string }): void;
}

const opaque = (value: string): OpaqueId => value as OpaqueId;

/** Local-only managed provider. It deliberately never launches a runtime itself. */
export class LocalManagedExecutionProvider implements ExecutionProvider {
  readonly id = "managed-disposable";
  readonly kind = "disposable" as const;
  readonly capabilities: ReadonlySet<ExecutionCapability>;

  constructor(capabilities: readonly ExecutionCapability[] = ["readOnly", "isolatedWorkspace"]) {
    this.capabilities = new Set(capabilities);
  }

  async preflight(_input: ResolvedExecutionEnvelope): Promise<void> {}
  async cancel(_input: { readonly executionId: OpaqueId; readonly runId: OpaqueId }): Promise<void> {}
}

export class ExecutionAdmissionService {
  constructor(
    private readonly store: ExecutionAdmissionStore,
    private readonly providers: ExecutionProviderRegistry,
    private readonly limits: { readonly maxRunDurationMs: number },
  ) {}

  async admit(input: {
    readonly runId: string;
    readonly tenantId: string;
    readonly projectId: string;
    readonly conversationId: string;
    readonly taskKind: ResolvedExecutionEnvelope["taskKind"];
    readonly runtimeId: string;
    readonly providerId: string;
    readonly requiredCapabilities: readonly ExecutionCapability[];
    readonly trigger?: ExecutionIntentTrigger;
  }): Promise<ResolvedExecutionEnvelope> {
    const trigger = input.trigger ?? "manual";
    if (trigger !== "manual") throw new ExecutionProviderError("manualTriggerRequired", input.providerId);
    const provider = this.providers.select(input.providerId, input.requiredCapabilities);
    const envelope: ResolvedExecutionEnvelope = Object.freeze({
      executionId: opaque(`exe_${randomUUID()}`), runId: opaque(input.runId), tenantId: opaque(input.tenantId),
      projectId: opaque(input.projectId), conversationId: opaque(input.conversationId), taskKind: input.taskKind,
      trigger, runtimeId: input.runtimeId, providerId: provider.id,
      requiredCapabilities: Object.freeze([...input.requiredCapabilities]),
      resourceBudget: Object.freeze({ maxDurationMs: this.limits.maxRunDurationMs }),
      deadlineAt: new Date(Date.now() + this.limits.maxRunDurationMs).toISOString(),
    });
    // This is intentionally before any workspace, session, or turn side effect.
    this.store.createExecution(envelope);
    try {
      await provider.preflight(envelope);
      this.store.markExecution({ tenantId: input.tenantId, executionId: String(envelope.executionId), state: "preflightPassed" });
      return envelope;
    } catch {
      this.store.markExecution({ tenantId: input.tenantId, executionId: String(envelope.executionId), state: "failed", failureCode: "preflightFailed" });
      throw new ExecutionProviderError("executionProviderUnavailable", provider.id);
    }
  }

  async cancel(input: { readonly tenantId: string; readonly executionId: string; readonly runId: string; readonly providerId: string }): Promise<ExecutionOutcome> {
    const provider = this.providers.select(input.providerId, []);
    await provider.cancel({ executionId: opaque(input.executionId), runId: opaque(input.runId) });
    return { state: "completed", executionId: opaque(input.executionId) };
  }

  finish(input: { readonly tenantId: string; readonly runId: string; readonly state: "completed" | "interrupted" | "failed"; readonly failureCode?: string }): void {
    this.store.markExecutionForRun(input);
  }
}
