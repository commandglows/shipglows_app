import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RuntimeCapabilityError,
  RuntimeRegistry,
  type AgentRuntime,
  type OpaqueId,
  type RuntimeCapability,
} from "../../src/contracts/index.js";

const opaque = (value: string) => value as OpaqueId;

function fakeRuntime(id: string, capabilities: readonly RuntimeCapability[]): AgentRuntime {
  return {
    id,
    capabilities: new Set(capabilities),
    createSession: async () => ({ runtimeSessionId: opaque("runtime-session"), state: "idle" }),
    resumeSession: async () => ({ runtimeSessionId: opaque("runtime-session"), state: "idle" }),
    startTurn: async () => ({ runtimeTurnId: opaque("runtime-turn"), state: "queued" }),
    interruptTurn: async () => undefined,
    async *events() {
      yield { type: "message.assistant.completed", occurredAt: "2026-08-01T00:00:00.000Z", payload: {} };
    },
  };
}

describe("runtime-neutral agent contract", () => {
  it("accepts a second fake runtime without exposing Codex protocol types", async () => {
    const registry = new RuntimeRegistry([
      fakeRuntime("codex", ["sessions", "turns", "semanticEvents", "interrupt"]),
      fakeRuntime("eve-spike", ["sessions", "turns", "semanticEvents"]),
    ]);

    const selected = registry.select("eve-spike", ["sessions", "turns", "semanticEvents"]);
    const session = await selected.createSession({
      conversationId: opaque("cnv_000000000001"),
      accessMode: "readOnly",
      workspace: { root: "C:\\project", kind: "project" },
    });
    const turn = await selected.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Audit this project" });

    assert.equal(session.state, "idle");
    assert.equal(turn.state, "queued");
  });

  it("rejects an unsupported capability instead of silently falling back", () => {
    const registry = new RuntimeRegistry([
      fakeRuntime("eve-spike", ["sessions", "turns", "semanticEvents"]),
    ]);

    assert.throws(
      () => registry.select("eve-spike", ["approvals"]),
      (error: unknown) =>
        error instanceof RuntimeCapabilityError &&
        error.runtimeId === "eve-spike" &&
        error.missing.includes("approvals"),
    );
  });
});
