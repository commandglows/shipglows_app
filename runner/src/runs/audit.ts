import { randomUUID } from "node:crypto";

import type { AgentRuntime, OpaqueId, ProjectWorkspaceResolver, RuntimeEvent } from "../contracts/index.js";
import type { OperationalStore } from "../db/index.js";
import type { EventHub } from "../events/index.js";
import { RunAdmission, RunLimitError } from "./limits.js";
import type { ExecutionAdmissionService } from "./execution.js";
import type { ProjectDeliveryRepository } from "../workspaces/projectDelivery.js";

export type AuditCommandStore = Pick<
  OperationalStore,
  "createConversation" | "createRun" | "appendEvent" | "saveRuntimeSession" | "checkpointRun"
> & Partial<Pick<OperationalStore, "createApproval" | "getApproval" | "resolveApproval">>;

export interface AuditCommandResult {
  readonly conversationId: string;
  readonly runId: string;
  readonly state: "running" | "failed";
}

interface RunLifecycle {
  readonly tenantId: string;
  readonly runId: string;
  readonly conversationId: string;
  readonly runtimeSessionId: OpaqueId;
  readonly runtimeTurnId: OpaqueId;
  readonly executionId?: string;
  readonly release: () => void;
  timeout?: NodeJS.Timeout;
  finalized: boolean;
}

function opaque(value: string): OpaqueId {
  return value as OpaqueId;
}

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export class AuditCommandService {
  constructor(
    private readonly store: AuditCommandStore,
    private readonly runtime: AgentRuntime,
    private readonly eventHub?: EventHub,
    private readonly limits: { readonly maxConcurrentRunsPerTenant: number; readonly maxRunDurationMs: number } = {
      maxConcurrentRunsPerTenant: 2,
      maxRunDurationMs: 15 * 60 * 1000,
    },
    private readonly admission: RunAdmission = new RunAdmission(),
    private readonly execution?: ExecutionAdmissionService,
    private readonly resolveWorkspace?: ProjectWorkspaceResolver,
    private readonly delivery?: ProjectDeliveryRepository,
  ) {}

  #appendEvent(input: Parameters<AuditCommandStore["appendEvent"]>[0]) {
    const event = this.store.appendEvent(input);
    this.eventHub?.publish(event);
    return event;
  }

  #finalize(input: RunLifecycle, state: "completed" | "failed" | "interrupted", checkpoint: Record<string, unknown>, event?: { readonly type: string; readonly payload: Record<string, unknown> }): void {
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

  async #timeoutRun(input: RunLifecycle): Promise<void> {
    if (input.finalized) return;
    try {
      await this.runtime.interruptTurn({
        runtimeSessionId: input.runtimeSessionId,
        runtimeTurnId: input.runtimeTurnId,
      });
      this.#finalize(input, "interrupted", { phase: "timeout", code: "runTimeout" }, {
        type: "run.interrupted",
        payload: { runId: input.runId, code: "runTimeout" },
      });
    } catch {
      this.#finalize(input, "failed", { phase: "timeout", code: "timeoutInterruptFailed" }, {
        type: "run.failed",
        payload: { runId: input.runId, code: "timeoutInterruptFailed" },
      });
    }
  }

  async #persistRuntimeEvents(input: { readonly lifecycle: RunLifecycle }): Promise<void> {
    try {
      for await (const event of this.runtime.events({ runtimeSessionId: input.lifecycle.runtimeSessionId })) {
        this.#persistApproval(input.lifecycle, event);
        this.#appendEvent({
          id: id("evt"),
          tenantId: input.lifecycle.tenantId,
          conversationId: input.lifecycle.conversationId,
          type: event.type,
          payload: event.payload,
        });
        const terminalState = event.type === "turn.completed"
          ? "completed"
          : event.type === "turn.failed"
            ? "failed"
            : event.type === "turn.interrupted"
              ? "interrupted"
              : undefined;
        if (terminalState !== undefined) {
          this.#finalize(input.lifecycle, terminalState, { phase: "turn_finished", eventType: event.type });
          return;
        }
      }
    } catch {
      try {
        await this.runtime.interruptTurn({ runtimeSessionId: input.lifecycle.runtimeSessionId, runtimeTurnId: input.lifecycle.runtimeTurnId });
      } catch {
        // The durable failure below remains authoritative when provider cancellation also fails.
      }
      this.#finalize(input.lifecycle, "failed", { phase: "event_stream_failed", code: "eventStreamUnavailable" }, {
        type: "run.failed",
        payload: { runId: input.lifecycle.runId, code: "eventStreamUnavailable" },
      });
    }
  }

  #persistApproval(lifecycle: RunLifecycle, event: RuntimeEvent): void {
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

  async start(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly scope: string;
  }): Promise<AuditCommandResult> {
    if (!/^[\u0020-\u007E]{1,128}$/.test(input.scope)) throw new Error("Audit scope is invalid.");
    const resolvedWorkspace = await this.resolveWorkspace?.(input) ?? null;
    if (resolvedWorkspace === null) throw new Error("Trusted project workspace is unavailable.");
    const workspace = typeof resolvedWorkspace === "string"
      ? { root: resolvedWorkspace, deliveryBranch: "main" as const }
      : resolvedWorkspace;
    const admitted = this.delivery === undefined ? workspace : await this.delivery.admit(workspace);
    if (!this.admission.acquire(input.tenantId, this.limits.maxConcurrentRunsPerTenant)) {
      throw new RunLimitError("runQuotaExceeded", "The tenant has reached its active run quota.");
    }
    const release = () => this.admission.release(input.tenantId);
    const conversationId = id("cnv");
    const runId = id("run");
    let executionAdmitted = false;
    this.store.createConversation({
      id: conversationId,
      tenantId: input.tenantId,
      projectId: input.projectId,
      createdBy: input.userId,
      title: `Audit: ${input.scope}`,
    });
    this.store.createRun({
      id: runId,
      tenantId: input.tenantId,
      projectId: input.projectId,
      conversationId,
      runtimeId: this.runtime.id,
      executionProviderId: "managed-disposable",
      taskKind: "audit",
    });
    this.#appendEvent({
      id: id("evt"),
      tenantId: input.tenantId,
      conversationId,
      type: "run.queued",
      payload: { runId, scope: input.scope },
    });
    try {
      await this.execution?.admit({ runId, tenantId: input.tenantId, projectId: input.projectId, conversationId, taskKind: "audit", runtimeId: this.runtime.id, providerId: "managed-disposable", requiredCapabilities: ["readOnly"] });
      executionAdmitted = this.execution !== undefined;
      const session = await this.runtime.createSession({
        conversationId: opaque(conversationId),
        accessMode: "readOnly",
        workspace: { root: admitted.root, kind: "project" },
      });
      this.store.saveRuntimeSession({
        id: id("ses"),
        tenantId: input.tenantId,
        conversationId,
        runtimeId: this.runtime.id,
        runtimeSessionId: String(session.runtimeSessionId),
        state: session.state,
      });
      const turn = await this.runtime.startTurn({
        runtimeSessionId: session.runtimeSessionId,
        message: `Run the ShipGlows audit scope: ${input.scope}`,
      });
      this.store.checkpointRun({
        tenantId: input.tenantId,
        runId,
        state: "running",
        checkpoint: { phase: "turn_started", runtimeTurnId: String(turn.runtimeTurnId) },
      });
      this.#appendEvent({
        id: id("evt"),
        tenantId: input.tenantId,
        conversationId,
        type: "run.started",
        payload: { runId },
      });
      const lifecycle: RunLifecycle = {
        tenantId: input.tenantId,
        runId,
        conversationId,
        runtimeSessionId: session.runtimeSessionId,
        runtimeTurnId: turn.runtimeTurnId,
        release,
        finalized: false,
      };
      lifecycle.timeout = setTimeout(() => { void this.#timeoutRun(lifecycle); }, this.limits.maxRunDurationMs);
      void this.#persistRuntimeEvents({ lifecycle });
      return { conversationId, runId, state: "running" };
    } catch {
      release();
      if (executionAdmitted) this.execution?.finish({ tenantId: input.tenantId, runId, state: "failed", failureCode: "runtimeUnavailable" });
      this.store.checkpointRun({
        tenantId: input.tenantId,
        runId,
        state: "failed",
        checkpoint: { phase: "runtime_unavailable", code: "runtimeUnavailable" },
      });
      this.#appendEvent({
        id: id("evt"),
        tenantId: input.tenantId,
        conversationId,
        type: "run.failed",
        payload: { runId, code: "runtimeUnavailable" },
      });
      return { conversationId, runId, state: "failed" };
    }
  }
}
