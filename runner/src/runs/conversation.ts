import { randomUUID } from "node:crypto";

import type { AgentRuntime, OpaqueId } from "../contracts/index.js";
import type { OperationalStore, PersistedRun } from "../db/index.js";
import type { EventHub } from "../events/index.js";
import { RunAdmission, RunLimitError } from "./limits.js";
import type { ExecutionAdmissionService } from "./execution.js";

export type ConversationCommandStore = Pick<
  OperationalStore,
  "createConversation" | "getConversation" | "createRun" | "getRun" | "getLatestRun" | "saveRuntimeSession" |
  "getRuntimeSession" | "checkpointRun" | "appendEvent"
>;

export interface ConversationResult {
  readonly conversationId: string;
  readonly state: "idle" | "running" | "failed" | "interrupted";
  readonly runId?: string;
}

export class ConversationCommandError extends Error {
  constructor(
    readonly code: "conversationNotFound" | "runtimeUnavailable" | "activeTurnUnavailable",
    message: string,
  ) {
    super(message);
    this.name = "ConversationCommandError";
  }
}

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function opaque(value: string): OpaqueId {
  return value as OpaqueId;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function runtimeTurnId(run: PersistedRun): OpaqueId | undefined {
  const value = record(run.checkpoint)?.["runtimeTurnId"];
  return typeof value === "string" && value.length > 0 ? opaque(value) : undefined;
}

export class ConversationCommandService {
  constructor(
    private readonly store: ConversationCommandStore,
    private readonly runtime: AgentRuntime,
    private readonly eventHub?: EventHub,
    private readonly limits: { readonly maxConcurrentRunsPerTenant: number; readonly maxRunDurationMs: number } = {
      maxConcurrentRunsPerTenant: 2,
      maxRunDurationMs: 15 * 60 * 1000,
    },
    private readonly admission: RunAdmission = new RunAdmission(),
    private readonly execution?: ExecutionAdmissionService,
  ) {}

  #appendEvent(input: Parameters<ConversationCommandStore["appendEvent"]>[0]): void {
    const event = this.store.appendEvent(input);
    this.eventHub?.publish(event);
  }

  async create(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string; readonly title: string }): Promise<ConversationResult> {
    const conversationId = id("cnv");
    this.store.createConversation({ id: conversationId, tenantId: input.tenantId, projectId: input.projectId, createdBy: input.userId, title: input.title });
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
    } catch {
      throw new ConversationCommandError("runtimeUnavailable", "The runtime could not create the conversation session.");
    }
    this.#appendEvent({
      id: id("evt"),
      tenantId: input.tenantId,
      conversationId,
      type: "conversation.created",
      payload: { conversationId, projectId: input.projectId },
    });
    return { conversationId, state: "idle" };
  }

  async message(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly conversationId: string;
    readonly text: string;
  }): Promise<ConversationResult> {
    const conversation = this.store.getConversation({ tenantId: input.tenantId, conversationId: input.conversationId });
    if (conversation?.projectId !== input.projectId) {
      throw new ConversationCommandError("conversationNotFound", "The conversation was not found.");
    }
    const session = this.store.getRuntimeSession({ tenantId: input.tenantId, conversationId: input.conversationId });
    if (session === undefined) throw new ConversationCommandError("runtimeUnavailable", "The runtime session is unavailable.");
    if (!this.admission.acquire(input.tenantId, this.limits.maxConcurrentRunsPerTenant)) {
      throw new RunLimitError("runQuotaExceeded", "The tenant has reached its active run quota.");
    }
    const release = () => this.admission.release(input.tenantId);
    const runId = id("run");
    let executionAdmitted = false;
    this.store.createRun({
      id: runId,
      tenantId: input.tenantId,
      projectId: input.projectId,
      conversationId: input.conversationId,
      runtimeId: this.runtime.id,
      executionProviderId: "managed-disposable",
      taskKind: "conversation",
    });
    this.#appendEvent({
      id: id("evt"),
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      type: "message.user",
      payload: { runId, text: input.text },
    });
    try {
      await this.execution?.admit({ runId, tenantId: input.tenantId, projectId: input.projectId, conversationId: input.conversationId, taskKind: "conversation", runtimeId: this.runtime.id, providerId: "managed-disposable", requiredCapabilities: [] });
      executionAdmitted = this.execution !== undefined;
      const turn = await this.runtime.startTurn({ runtimeSessionId: opaque(session.runtimeSessionId), message: input.text });
      this.store.checkpointRun({
        tenantId: input.tenantId,
        runId,
        state: "running",
        checkpoint: { phase: "turn_started", runtimeTurnId: String(turn.runtimeTurnId) },
      });
      this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId: input.conversationId, type: "turn.started", payload: { runId } });
      const lifecycle = { finalized: false, timeout: undefined as NodeJS.Timeout | undefined };
      const finalize = (state: "completed" | "failed" | "interrupted", code?: string) => {
        if (lifecycle.finalized) return;
        lifecycle.finalized = true;
        if (lifecycle.timeout !== undefined) clearTimeout(lifecycle.timeout);
        this.store.checkpointRun({ tenantId: input.tenantId, runId, state, checkpoint: { phase: "turn_finished", ...(code === undefined ? {} : { code }) } });
        if (executionAdmitted) this.execution?.finish({ tenantId: input.tenantId, runId, state, ...(state === "failed" ? { failureCode: code ?? "runtimeFailed" } : {}) });
        release();
      };
      const persistEvents = async (): Promise<void> => {
        try {
          for await (const event of this.runtime.events({ runtimeSessionId: opaque(session.runtimeSessionId) })) {
            this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId: input.conversationId, type: event.type, payload: event.payload });
            const terminal = event.type === "turn.completed" ? "completed" : event.type === "turn.failed" ? "failed" : event.type === "turn.interrupted" ? "interrupted" : undefined;
            if (terminal !== undefined) {
              finalize(terminal);
              return;
            }
          }
        } catch {
          finalize("failed", "eventStreamUnavailable");
        }
      };
      lifecycle.timeout = setTimeout(() => {
        void (async () => {
          try {
            await this.runtime.interruptTurn({ runtimeSessionId: opaque(session.runtimeSessionId), runtimeTurnId: turn.runtimeTurnId });
            finalize("interrupted", "runTimeout");
          } catch {
            finalize("failed", "timeoutInterruptFailed");
          }
        })();
      }, this.limits.maxRunDurationMs);
      void persistEvents();
      return { conversationId: input.conversationId, runId, state: "running" };
    } catch {
      release();
      this.store.checkpointRun({ tenantId: input.tenantId, runId, state: "failed", checkpoint: { phase: "runtime_unavailable", code: "runtimeUnavailable" } });
      if (executionAdmitted) this.execution?.finish({ tenantId: input.tenantId, runId, state: "failed", failureCode: "runtimeUnavailable" });
      return { conversationId: input.conversationId, runId, state: "failed" };
    }
  }

  async interrupt(input: { readonly tenantId: string; readonly projectId: string; readonly conversationId: string }): Promise<ConversationResult> {
    const context = this.#context(input);
    const turnId = runtimeTurnId(context.run);
    if (turnId === undefined) throw new ConversationCommandError("activeTurnUnavailable", "There is no active turn to interrupt.");
    try {
      await this.runtime.interruptTurn({ runtimeSessionId: opaque(context.session.runtimeSessionId), runtimeTurnId: turnId });
    } catch {
      throw new ConversationCommandError("runtimeUnavailable", "The runtime could not interrupt the turn.");
    }
    this.store.checkpointRun({ tenantId: input.tenantId, runId: context.run.id, state: "interrupted", checkpoint: { phase: "interrupted", code: "operatorInterrupted" } });
    this.execution?.finish({ tenantId: input.tenantId, runId: context.run.id, state: "interrupted" });
    this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId: input.conversationId, type: "turn.interrupted", payload: { runId: context.run.id, code: "operatorInterrupted" } });
    return { conversationId: input.conversationId, runId: context.run.id, state: "interrupted" };
  }

  async resume(input: { readonly tenantId: string; readonly projectId: string; readonly conversationId: string }): Promise<ConversationResult> {
    const conversation = this.store.getConversation({ tenantId: input.tenantId, conversationId: input.conversationId });
    if (conversation?.projectId !== input.projectId) throw new ConversationCommandError("conversationNotFound", "The conversation was not found.");
    const currentSession = this.store.getRuntimeSession({ tenantId: input.tenantId, conversationId: input.conversationId });
    if (currentSession === undefined) throw new ConversationCommandError("runtimeUnavailable", "The runtime session is unavailable.");
    try {
      const session = await this.runtime.resumeSession({ runtimeSessionId: opaque(currentSession.runtimeSessionId) });
      this.store.saveRuntimeSession({ id: id("ses"), tenantId: input.tenantId, conversationId: input.conversationId, runtimeId: this.runtime.id, runtimeSessionId: String(session.runtimeSessionId), state: session.state });
    } catch {
      throw new ConversationCommandError("runtimeUnavailable", "The runtime could not resume the conversation.");
    }
    this.#appendEvent({ id: id("evt"), tenantId: input.tenantId, conversationId: input.conversationId, type: "conversation.stateChanged", payload: { state: "idle" } });
    return { conversationId: input.conversationId, state: "idle" };
  }

  #context(input: { readonly tenantId: string; readonly projectId: string; readonly conversationId: string }): { readonly run: PersistedRun; readonly session: { readonly runtimeSessionId: string } } {
    const conversation = this.store.getConversation({ tenantId: input.tenantId, conversationId: input.conversationId });
    if (conversation?.projectId !== input.projectId) {
      throw new ConversationCommandError("conversationNotFound", "The conversation was not found.");
    }
    const session = this.store.getRuntimeSession({ tenantId: input.tenantId, conversationId: input.conversationId });
    const run = session !== undefined
      ? this.store.getLatestRun({ tenantId: input.tenantId, conversationId: input.conversationId })
      : undefined;
    if (session?.runtimeSessionId === undefined || run?.state !== "running") {
      throw new ConversationCommandError("activeTurnUnavailable", "There is no active turn for this conversation.");
    }
    return { run, session };
  }

}
