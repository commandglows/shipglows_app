import type { AgentRuntime, OpaqueId, ProjectWorkspaceResolver, RuntimeEvent } from "../contracts/index.js";
import { RuntimeCapabilityError } from "../contracts/index.js";
import type { OperationalStore, PersistedEvent } from "../db/index.js";
import type { EventHub } from "../events/index.js";
import { ProjectDeliveryError, type ProjectDeliveryRepository, type ProjectDeliveryWorkspace } from "../workspaces/projectDelivery.js";
import { RunLimitError } from "./limits.js";
import type { RunAdmission } from "./limits.js";
import { randomUUID } from "node:crypto";
import type { ExecutionAdmissionService } from "./execution.js";

export interface FixCommandInput {
  readonly issueId: string;
  readonly instruction: string;
}

export interface FixCommandResult {
  readonly conversationId: string;
  readonly runId: string;
  readonly state: "running" | "failed";
}

export interface FixCommandExecutor {
  start(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly issueId: string;
    readonly instruction: string;
  }): Promise<FixCommandResult>;
}

export class FixUnavailableError extends Error {
  constructor(readonly code: "fixBindingUnavailable" | "fixWorkspaceUnavailable" = "fixWorkspaceUnavailable") {
    super("The isolated fix executor is unavailable.");
    this.name = "FixUnavailableError";
  }
}

type FixStore = Pick<
  OperationalStore,
  "createConversation" | "createRun" | "appendEvent" | "saveRuntimeSession" | "checkpointRun" |
  "getConversation"
> & Partial<Pick<OperationalStore, "createApproval" | "getApproval" | "resolveApproval" | "closeConversation">>;

interface FixLifecycle {
  readonly tenantId: string;
  readonly conversationId: string;
  readonly runId: string;
  readonly runtimeSessionId: OpaqueId;
  readonly runtimeTurnId: OpaqueId;
  readonly release: () => void;
  readonly deliveryWorkspace: ProjectDeliveryWorkspace;
  timeout?: NodeJS.Timeout;
  finalized: boolean;
}

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function opaque(value: string): OpaqueId {
  return value as OpaqueId;
}

export class ManagedFixCommandExecutor implements FixCommandExecutor {
  constructor(
    private readonly store: FixStore,
    private readonly runtime: AgentRuntime,
    private readonly resolveWorkspace: ProjectWorkspaceResolver,
    private readonly delivery: ProjectDeliveryRepository,
    private readonly eventHub: EventHub | undefined,
    private readonly limits: { readonly maxConcurrentRunsPerTenant: number; readonly maxRunDurationMs: number },
    private readonly admission: RunAdmission,
    private readonly execution?: ExecutionAdmissionService,
  ) {}

  #appendEvent(input: Omit<PersistedEvent, "cursor" | "occurredAt">): void {
    this.eventHub?.publish(this.store.appendEvent(input));
  }

  #finalize(input: FixLifecycle, state: "completed" | "failed" | "interrupted", checkpoint: Record<string, unknown>, event?: { readonly type: string; readonly payload: Record<string, unknown> }): void {
    if (input.finalized) return;
    input.finalized = true;
    if (input.timeout !== undefined) clearTimeout(input.timeout);
    try {
      this.store.checkpointRun({ tenantId: input.tenantId, runId: input.runId, state, checkpoint });
      const checkpointCode = checkpoint["code"];
      this.execution?.finish({ tenantId: input.tenantId, runId: input.runId, state, ...(state === "failed" ? { failureCode: typeof checkpointCode === "string" ? checkpointCode : "runtimeFailed" } : {}) });
      if (event !== undefined) {
        this.#appendEvent({
          id: id("evt"),
          tenantId: input.tenantId,
          conversationId: input.conversationId,
          type: event.type,
          payload: event.payload,
        });
      }
    } finally {
      input.release();
    }
  }

  async #timeout(input: FixLifecycle): Promise<void> {
    if (input.finalized) return;
    try {
      await this.runtime.interruptTurn({ runtimeSessionId: opaque(input.runtimeSessionId), runtimeTurnId: opaque(input.runtimeTurnId) });
      this.#finalize(input, "interrupted", { phase: "timeout", code: "runTimeout" }, { type: "run.interrupted", payload: { runId: input.runId, code: "runTimeout" } });
    } catch {
      this.#finalize(input, "failed", { phase: "timeout", code: "timeoutInterruptFailed" }, { type: "run.failed", payload: { runId: input.runId, code: "timeoutInterruptFailed" } });
    }
  }

  async #events(input: { readonly lifecycle: FixLifecycle }): Promise<void> {
    try {
      for await (const event of this.runtime.events({ runtimeSessionId: opaque(input.lifecycle.runtimeSessionId) })) {
        this.#persistApproval(input.lifecycle, event);
        this.#appendEvent({ id: id("evt"), tenantId: input.lifecycle.tenantId, conversationId: input.lifecycle.conversationId, type: event.type, payload: event.payload });
        const terminal = event.type === "turn.completed" ? "completed" : event.type === "turn.failed" ? "failed" : event.type === "turn.interrupted" ? "interrupted" : undefined;
        if (terminal !== undefined) {
          if (terminal === "completed") {
            try {
              await this.delivery.push(input.lifecycle.deliveryWorkspace);
            } catch (error) {
              const code = error instanceof ProjectDeliveryError ? error.code : "deliveryPushRejected";
              this.#finalize(input.lifecycle, "failed", { phase: "delivery_failed", code }, { type: "run.failed", payload: { runId: input.lifecycle.runId, code } });
              return;
            }
          }
          this.#finalize(input.lifecycle, terminal, { phase: "turn_finished", eventType: event.type });
          return;
        }
      }
    } catch {
      try {
        await this.runtime.interruptTurn({ runtimeSessionId: input.lifecycle.runtimeSessionId, runtimeTurnId: input.lifecycle.runtimeTurnId });
      } catch {
        // The durable failure below remains authoritative when provider cancellation also fails.
      }
      this.#finalize(input.lifecycle, "failed", { phase: "event_stream_failed", code: "eventStreamUnavailable" }, { type: "run.failed", payload: { runId: input.lifecycle.runId, code: "eventStreamUnavailable" } });
    }
  }

  #persistApproval(lifecycle: FixLifecycle, event: RuntimeEvent): void {
    const approvalId = event.payload["approvalId"];
    if (typeof approvalId !== "string") return;
    if (this.store.createApproval === undefined || this.store.getApproval === undefined || this.store.resolveApproval === undefined) {
      throw new Error("Durable approval storage is unavailable.");
    }
    if (event.type === "approval.requested") {
      this.store.createApproval({ id: approvalId, tenantId: lifecycle.tenantId, runId: lifecycle.runId, requestedAt: event.occurredAt });
    } else if (event.type === "approval.expired") {
      const approval = this.store.getApproval({ tenantId: lifecycle.tenantId, approvalId });
      if (approval?.state === "pending") this.store.resolveApproval({ tenantId: lifecycle.tenantId, approvalId, state: "expired", resolvedAt: event.occurredAt });
    }
  }

  async start(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string; readonly issueId: string; readonly instruction: string }): Promise<FixCommandResult> {
    assertFixRequest(input);
    assertFixRuntime(this.runtime);
    const resolvedWorkspace = await this.resolveWorkspace(input);
    if (resolvedWorkspace === null) throw new FixUnavailableError("fixWorkspaceUnavailable");
    const workspace = typeof resolvedWorkspace === "string" ? { root: resolvedWorkspace, deliveryBranch: "main" as const } : resolvedWorkspace;
    const deliveryWorkspace = await this.delivery.admit(workspace);
    if (!this.admission.acquire(input.tenantId, this.limits.maxConcurrentRunsPerTenant)) {
      throw new RunLimitError("runQuotaExceeded", "The tenant has reached its active run quota.");
    }
    const release = () => this.admission.release(input.tenantId);
    const conversationId = id("cnv");
    const runId = id("run");
    let executionAdmitted = false;
    let conversationCreated = false;
    try {
      this.store.createConversation({ id: conversationId, tenantId: input.tenantId, projectId: input.projectId, createdBy: input.userId, title: `Fix: ${input.issueId}` });
      conversationCreated = true;
      this.store.createRun({ id: runId, tenantId: input.tenantId, projectId: input.projectId, conversationId, runtimeId: this.runtime.id, executionProviderId: "managed-disposable", taskKind: "fix" });
      this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId, type: "run.queued", payload: { runId, taskKind: "fix", issueId: input.issueId } });
      await this.execution?.admit({ runId, tenantId: input.tenantId, projectId: input.projectId, conversationId, taskKind: "fix", runtimeId: this.runtime.id, providerId: "managed-disposable", requiredCapabilities: [] });
      executionAdmitted = this.execution !== undefined;
      const session = await this.runtime.createSession({
        conversationId: opaque(conversationId),
        accessMode: "workspaceWrite",
        workspace: { root: deliveryWorkspace.root, kind: "canonical" },
      });
      this.store.saveRuntimeSession({ id: id("ses"), tenantId: input.tenantId, conversationId, runtimeId: this.runtime.id, runtimeSessionId: String(session.runtimeSessionId), state: session.state });
      const turn = await this.runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: `Apply the approved ShipGlows fix ${input.issueId} on the configured ${deliveryWorkspace.branch} delivery branch. Commit the complete change and leave the checkout clean for the runner's non-force push. Instruction: ${input.instruction}` });
      this.store.checkpointRun({ tenantId: input.tenantId, runId, state: "running", checkpoint: { phase: "turn_started", runtimeTurnId: String(turn.runtimeTurnId), workspaceKind: "canonical", deliveryBranch: deliveryWorkspace.branch } });
      this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId, type: "run.started", payload: { runId, taskKind: "fix" } });
      const lifecycle: FixLifecycle = { tenantId: input.tenantId, conversationId, runId, runtimeSessionId: session.runtimeSessionId, runtimeTurnId: turn.runtimeTurnId, deliveryWorkspace, release, finalized: false };
      lifecycle.timeout = setTimeout(() => { void this.#timeout(lifecycle); }, this.limits.maxRunDurationMs);
      void this.#events({ lifecycle });
      return { conversationId, runId, state: "running" };
    } catch (error: unknown) {
      try {
        this.store.checkpointRun({ tenantId: input.tenantId, runId, state: "failed", checkpoint: { phase: "fix_executor_failed", code: "fixExecutorUnavailable" } });
        this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId, type: "run.failed", payload: { runId, code: "fixExecutorUnavailable" } });
      } catch {
        // Preserve the original safe failure surface even if projection recovery also fails.
      }
      if (executionAdmitted) this.execution?.finish({ tenantId: input.tenantId, runId, state: "failed", failureCode: "fixExecutorUnavailable" });
      if (conversationCreated) {
        try {
          this.store.closeConversation?.({ tenantId: input.tenantId, projectId: input.projectId, conversationId });
        } catch {
          // Preserve the original bounded executor failure.
        }
      }
      release();
      if (error instanceof RunLimitError) throw error;
      throw new FixUnavailableError();
    }
  }
}

export function assertFixRequest(input: FixCommandInput): void {
  if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(input.issueId)) {
    throw new Error("Fix issue identifier is invalid.");
  }
  if (!/^[\u0020-\u007E]{1,4000}$/.test(input.instruction)) {
    throw new Error("Fix instruction is invalid.");
  }
}

export function assertFixRuntime(runtime: Pick<AgentRuntime, "id" | "capabilities">): void {
  const required = ["sessions", "turns"] as const;
  const missing = required.filter((capability) => !runtime.capabilities.has(capability));
  if (missing.length > 0) {
    throw new RuntimeCapabilityError(runtime.id, missing);
  }
}
