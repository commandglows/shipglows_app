import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AgentRuntime, OpaqueId } from "../../src/contracts/index.js";
import type { AuditCommandStore } from "../../src/runs/audit.js";
import { AuditCommandService } from "../../src/runs/audit.js";
import { RunAdmission } from "../../src/runs/limits.js";

const opaque = (value: string) => value as OpaqueId;

describe("managed run limits", () => {
  it("admits up to the tenant limit and releases capacity", () => {
    const admission = new RunAdmission();
    assert.equal(admission.acquire("ten_1", 2), true);
    assert.equal(admission.acquire("ten_1", 2), true);
    assert.equal(admission.acquire("ten_1", 2), false);
    admission.release("ten_1");
    assert.equal(admission.acquire("ten_1", 2), true);
    admission.release("ten_1");
    admission.release("ten_1");
    admission.release("ten_1");
    assert.equal(admission.acquire("ten_1", 1), true);
  });

  it("interrupts and projects a run when its duration expires", async () => {
    let cursor = 0;
    let interrupted = 0;
    const states: string[] = [];
    const store: AuditCommandStore = {
      createConversation: () => undefined,
      createRun: () => ({
        id: "run_1",
        tenantId: "ten_1",
        projectId: "prj_1",
        conversationId: "cnv_1",
        runtimeId: "fake",
        executionProviderId: "managed-disposable",
        taskKind: "audit",
        state: "queued",
        checkpoint: { phase: "queued" },
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
      appendEvent: (input) => ({
        ...input,
        cursor: ++cursor,
        occurredAt: "2026-08-02T00:00:00.000Z",
      }),
      saveRuntimeSession: () => undefined,
      checkpointRun: (input) => {
        states.push(input.state);
        return {
          id: "run_1",
          tenantId: input.tenantId,
          projectId: "prj_1",
          conversationId: "cnv_1",
          runtimeId: "fake",
          executionProviderId: "managed-disposable",
          taskKind: "audit",
          state: input.state,
          checkpoint: input.checkpoint,
          createdAt: "2026-08-02T00:00:00.000Z",
          updatedAt: "2026-08-02T00:00:00.000Z",
        };
      },
    };
    const runtime: AgentRuntime = {
      id: "fake",
      capabilities: new Set(["sessions", "turns", "interrupt", "semanticEvents"]),
      createSession: async () => ({ runtimeSessionId: opaque("session_1"), state: "idle" }),
      resumeSession: async () => ({ runtimeSessionId: opaque("session_1"), state: "idle" }),
      startTurn: async () => ({ runtimeTurnId: opaque("turn_1"), state: "queued" }),
      interruptTurn: async () => { interrupted += 1; },
      async *events() {
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
    };
    const service = new AuditCommandService(
      store,
      runtime,
      undefined,
      { maxConcurrentRunsPerTenant: 1, maxRunDurationMs: 10 },
      new RunAdmission(),
    );

    const result = await service.start({ tenantId: "ten_1", userId: "usr_1", projectId: "prj_1", scope: "security" });
    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.equal(result.state, "running");
    assert.equal(interrupted, 1);
    assert.deepEqual(states, ["running", "interrupted"]);
  });
});
