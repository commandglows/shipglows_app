import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AgentRuntime, OpaqueId } from "../../src/contracts/index.js";
import type { PersistedRun } from "../../src/db/index.js";
import { ApprovalCommandError, ApprovalCommandService, type ApprovalCommandStore } from "../../src/runs/approval.js";

const tenantId = "ten_agentic_policy";
const projectId = "prj_agentic_policy";
const conversationId = "cnv_agentic_policy";
const approvalId = "apr_agentic_policy";

function run(taskKind: PersistedRun["taskKind"], state: PersistedRun["state"] = "running"): PersistedRun {
  return {
    id: "run_agentic_policy",
    tenantId,
    projectId,
    conversationId,
    runtimeId: "codex",
    executionProviderId: "managed-disposable",
    taskKind,
    state,
    checkpoint: {},
    createdAt: "2026-08-08T00:00:00.000Z",
    updatedAt: "2026-08-08T00:00:00.000Z",
  };
}

function harness(taskKind: PersistedRun["taskKind"], state: PersistedRun["state"] = "running") {
  let runtimeCalls = 0;
  let persistedResolutions = 0;
  const persistedRun = run(taskKind, state);
  const store: ApprovalCommandStore = {
    getApproval: () => ({ id: approvalId, tenantId, runId: persistedRun.id, state: "pending", requestedAt: "2026-08-08T00:00:00.000Z", resolvedAt: null }),
    getRun: () => persistedRun,
    getRuntimeSession: () => ({ id: "ses_agentic_policy", tenantId, conversationId, runtimeId: "codex", runtimeSessionId: "thread_agentic_policy", state: "active" }),
    resolveApproval: () => { persistedResolutions += 1; },
    appendEvent: (input) => ({ ...input, cursor: 1, occurredAt: "2026-08-08T00:00:00.000Z" }),
  };
  const runtime: AgentRuntime = {
    id: "codex",
    capabilities: new Set(["approvals"]),
    createSession: async () => ({ runtimeSessionId: "thread_agentic_policy" as OpaqueId, state: "idle" }),
    resumeSession: async () => ({ runtimeSessionId: "thread_agentic_policy" as OpaqueId, state: "idle" }),
    startTurn: async () => ({ runtimeTurnId: "turn_agentic_policy" as OpaqueId, state: "queued" }),
    interruptTurn: async () => undefined,
    resolveApproval: async () => { runtimeCalls += 1; },
    async *events() { yield* []; },
  };
  return {
    service: new ApprovalCommandService(store, runtime),
    counts: () => ({ runtimeCalls, persistedResolutions }),
  };
}

async function assertPolicyDenied(taskKind: "audit" | "conversation"): Promise<void> {
  const { service, counts } = harness(taskKind);
  await assert.rejects(
    service.resolve({ tenantId, projectId, approvalId, decision: "approve" }),
    (error: unknown) => error instanceof ApprovalCommandError && error.code === "approvalPolicyDenied",
  );
  assert.deepEqual(counts(), { runtimeCalls: 0, persistedResolutions: 0 });
}

describe("agentic security adversarial policy", () => {
  it("blocks a repository prompt injection from escalating a read-only audit", async () => {
    await assertPolicyDenied("audit");
  });

  it("blocks a conversation instruction asking the runtime to read secrets", async () => {
    await assertPolicyDenied("conversation");
  });

  it("blocks an exfiltration instruction targeting a model-generated URL", async () => {
    await assertPolicyDenied("conversation");
  });

  it("hides a cross-project approval instead of resolving it", async () => {
    const { service, counts } = harness("fix");
    await assert.rejects(
      service.resolve({ tenantId, projectId: "prj_attacker", approvalId, decision: "approve" }),
      (error: unknown) => error instanceof ApprovalCommandError && error.code === "approvalNotFound",
    );
    assert.deepEqual(counts(), { runtimeCalls: 0, persistedResolutions: 0 });
  });

  it("keeps denial available without granting the requested capability", async () => {
    const { service, counts } = harness("audit");
    const result = await service.resolve({ tenantId, projectId, approvalId, decision: "deny" });
    assert.deepEqual(result, { approvalId, state: "denied" });
    assert.deepEqual(counts(), { runtimeCalls: 1, persistedResolutions: 1 });
  });

  it("expires a stale approval without calling the runtime", async () => {
    const { service, counts } = harness("fix", "completed");
    await assert.rejects(
      service.resolve({ tenantId, projectId, approvalId, decision: "approve" }),
      (error: unknown) => error instanceof ApprovalCommandError && error.code === "approvalAlreadyResolved",
    );
    assert.deepEqual(counts(), { runtimeCalls: 0, persistedResolutions: 1 });
  });
});
