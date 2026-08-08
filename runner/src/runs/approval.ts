import { randomUUID } from "node:crypto";

import type { AgentRuntime, ApprovalDecision, OpaqueId } from "../contracts/index.js";
import type { EventHub } from "../events/index.js";
import type { OperationalStore, PersistedApproval, PersistedRun, PersistedRuntimeSession } from "../db/index.js";

export type ApprovalCommandStore = Pick<
  OperationalStore,
  "getApproval" | "getRun" | "getRuntimeSession" | "resolveApproval" | "appendEvent"
>;

export interface ApprovalCommandResult {
  readonly approvalId: string;
  readonly state: "approved" | "denied";
}

export class ApprovalCommandError extends Error {
  constructor(
    readonly code: "approvalNotFound" | "approvalAlreadyResolved" | "approvalPolicyDenied" | "runtimeUnavailable",
    message: string,
  ) {
    super(message);
    this.name = "ApprovalCommandError";
  }
}

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function opaque(value: string): OpaqueId {
  return value as OpaqueId;
}

export class ApprovalCommandService {
  constructor(
    private readonly store: ApprovalCommandStore,
    private readonly runtime: AgentRuntime,
    private readonly eventHub?: EventHub,
  ) {}

  #appendEvent(input: Parameters<ApprovalCommandStore["appendEvent"]>[0]): void {
    const event = this.store.appendEvent(input);
    this.eventHub?.publish(event);
  }

  async resolve(input: {
    readonly tenantId: string;
    readonly projectId: string;
    readonly approvalId: string;
    readonly decision: ApprovalDecision;
  }): Promise<ApprovalCommandResult> {
    const approval: PersistedApproval | undefined = this.store.getApproval({
      tenantId: input.tenantId,
      approvalId: input.approvalId,
    });
    if (approval === undefined) {
      throw new ApprovalCommandError("approvalNotFound", "The approval was not found.");
    }
    const run: PersistedRun | undefined = this.store.getRun({ tenantId: input.tenantId, runId: approval.runId });
    if (run?.projectId !== input.projectId) {
      throw new ApprovalCommandError("approvalNotFound", "The approval was not found.");
    }
    if (approval.state !== "pending") {
      throw new ApprovalCommandError("approvalAlreadyResolved", "The approval has already been resolved.");
    }
    // Until provider-neutral action metadata is available, only an isolated fix run may
    // approve a privileged runtime action. Audit and conversation runs fail closed; a
    // hostile repository or prompt cannot turn their human approval UI into a capability
    // escalation. Denial always remains available so the operator can stop the request.
    if (input.decision === "approve" && run.taskKind !== "fix") {
      throw new ApprovalCommandError(
        "approvalPolicyDenied",
        "This run is not allowed to approve privileged runtime actions.",
      );
    }
    const session: PersistedRuntimeSession | undefined = this.store.getRuntimeSession({
      tenantId: input.tenantId,
      conversationId: run.conversationId,
    });
    if (session === undefined) {
      throw new ApprovalCommandError("runtimeUnavailable", "The runtime session is unavailable.");
    }
    try {
      if (this.runtime.resolveApproval === undefined) {
        throw new Error("The selected runtime does not support approvals.");
      }
      await this.runtime.resolveApproval({
        runtimeSessionId: opaque(session.runtimeSessionId),
        approvalId: opaque(input.approvalId),
        decision: input.decision,
      });
    } catch {
      throw new ApprovalCommandError("runtimeUnavailable", "The runtime could not resolve the approval.");
    }
    const state = input.decision === "approve" ? "approved" : "denied";
    this.store.resolveApproval({
      tenantId: input.tenantId,
      approvalId: input.approvalId,
      state,
      resolvedAt: new Date().toISOString(),
    });
    this.#appendEvent({
      id: id("evt"),
      tenantId: input.tenantId,
      conversationId: run.conversationId,
      type: "approval.resolved",
      payload: { approvalId: input.approvalId, decision: input.decision, state },
    });
    return { approvalId: input.approvalId, state };
  }
}
