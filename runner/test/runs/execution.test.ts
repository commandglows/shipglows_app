import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExecutionProviderError, ExecutionProviderRegistry, type ExecutionProvider, type OpaqueId } from "../../src/contracts/index.js";
import { ExecutionAdmissionService } from "../../src/runs/execution.js";

const opaque = (value: string) => value as OpaqueId;

describe("execution admission", () => {
  it("persists the immutable envelope before provider preflight", async () => {
    const order: string[] = [];
    const provider: ExecutionProvider = {
      id: "managed-disposable", kind: "disposable", capabilities: new Set(["readOnly"]),
      preflight: async () => { order.push("preflight"); },
      cancel: async () => undefined,
    };
    const store = {
      createExecution: () => { order.push("persist"); },
      markExecution: () => { order.push("mark"); },
      markExecutionForRun: () => { order.push("finish"); },
    };
    const service = new ExecutionAdmissionService(store, new ExecutionProviderRegistry([provider]), { maxRunDurationMs: 1_000 });
    const envelope = await service.admit({ runId: "run_1", tenantId: "ten_1", projectId: "prj_1", conversationId: "cnv_1", taskKind: "audit", runtimeId: "codex", providerId: "managed-disposable", requiredCapabilities: ["readOnly"] });
    assert.deepEqual(order, ["persist", "preflight", "mark"]);
    assert.equal(envelope.trigger, "manual");
    assert.equal(envelope.resourceBudget.maxDurationMs, 1_000);
    assert.equal(Object.isFrozen(envelope), true);
  });

  it("rejects unsupported provider capability without fallback or preflight", async () => {
    let preflighted = false;
    const provider: ExecutionProvider = { id: "only", kind: "disposable", capabilities: new Set(), preflight: async () => { preflighted = true; }, cancel: async () => undefined };
    const service = new ExecutionAdmissionService({ createExecution: () => assert.fail("must not persist"), markExecution: () => assert.fail("must not mark"), markExecutionForRun: () => assert.fail("must not finish") }, new ExecutionProviderRegistry([provider]), { maxRunDurationMs: 1_000 });
    await assert.rejects(
      service.admit({ runId: "run_1", tenantId: "ten_1", projectId: "prj_1", conversationId: "cnv_1", taskKind: "fix", runtimeId: "codex", providerId: "only", requiredCapabilities: ["isolatedWorkspace"] }),
      (error: unknown) => error instanceof ExecutionProviderError && error.code === "executionCapabilityUnavailable",
    );
    assert.equal(preflighted, false);
  });

  it("cancels with opaque execution and run identifiers only", async () => {
    let received: { executionId: OpaqueId; runId: OpaqueId } | undefined;
    const provider: ExecutionProvider = { id: "only", kind: "disposable", capabilities: new Set(), preflight: async () => undefined, cancel: async (input) => { received = input; } };
    const service = new ExecutionAdmissionService({ createExecution: () => undefined, markExecution: () => undefined, markExecutionForRun: () => undefined }, new ExecutionProviderRegistry([provider]), { maxRunDurationMs: 1_000 });
    const outcome = await service.cancel({ tenantId: "ten_1", executionId: "exe_1", runId: "run_1", providerId: "only" });
    assert.equal(outcome.state, "completed");
    assert.deepEqual(received, { executionId: opaque("exe_1"), runId: opaque("run_1") });
  });

  it("marks a preflight-passed execution terminal exactly once through its run", () => {
    const transitions: string[] = [];
    const service = new ExecutionAdmissionService({ createExecution: () => undefined, markExecution: () => undefined, markExecutionForRun: ({ state }) => transitions.push(state) }, new ExecutionProviderRegistry([]), { maxRunDurationMs: 1_000 });
    service.finish({ tenantId: "ten_1", runId: "run_1", state: "interrupted" });
    assert.deepEqual(transitions, ["interrupted"]);
  });
});
