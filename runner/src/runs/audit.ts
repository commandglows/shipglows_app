import { randomUUID } from "node:crypto";

import type { AgentRuntime, OpaqueId } from "../contracts/index.js";
import type { OperationalStore } from "../db/index.js";
import type { EventHub } from "../events/index.js";
import { RunAdmission, RunLimitError } from "./limits.js";

export type AuditCommandStore = Pick<
  OperationalStore,
  "createConversation" | "createRun" | "appendEvent" | "saveRuntimeSession" | "checkpointRun"
>;

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
      this.#finalize(input.lifecycle, "failed", { phase: "event_stream_failed", code: "eventStreamUnavailable" }, {
        type: "run.failed",
        payload: { runId: input.lifecycle.runId, code: "eventStreamUnavailable" },
      });
    }
  }

  async start(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly scope: string;
  }): Promise<AuditCommandResult> {
    if (!/^[\u0020-\u007E]{1,128}$/.test(input.scope)) throw new Error("Audit scope is invalid.");
    if (!this.admission.acquire(input.tenantId, this.limits.maxConcurrentRunsPerTenant)) {
      throw new RunLimitError("runQuotaExceeded", "The tenant has reached its active run quota.");
    }
    const release = () => this.admission.release(input.tenantId);
    const conversationId = id("cnv");
    const runId = id("run");
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
      const session = await this.runtime.createSession({ conversationId: opaque(conversationId) });
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
        message: `Run the ShipGlowz audit scope: ${input.scope}`,
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
