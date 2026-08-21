import assert from "node:assert/strict";
import { once } from "node:events";
import { describe, it } from "node:test";

import type {
  AgentCapabilities,
  PermissionOption,
  PromptResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SessionNotification,
} from "@agentclientprotocol/sdk";

import {
  AcpRuntime,
  BoundedLineTransform,
  StdioAcpConnection,
  acpEnvironment,
  type AcpClientHandlers,
  type AcpConnection,
} from "../../src/agent-runtime/acp/index.js";
import { RuntimeCapabilityError, type OpaqueId } from "../../src/contracts/index.js";

const opaque = (value: string): OpaqueId => value as OpaqueId;

class FakeAcpConnection implements AcpConnection {
  readonly calls: { method: string; input?: unknown }[] = [];
  handlers: AcpClientHandlers | undefined;
  capabilities: AgentCapabilities = { sessionCapabilities: { resume: {} } };
  newSessionResult: Awaited<ReturnType<AcpConnection["newSession"]>> = {
    sessionId: "acp_session_1",
    modes: { currentModeId: "agent", availableModes: [{ id: "read-only", name: "Read-only" }, { id: "agent", name: "Agent" }] },
  };
  promptResult: Promise<PromptResponse> = Promise.resolve({ stopReason: "end_turn" });
  closed = false;
  cancelResult: Promise<void> = Promise.resolve();

  initialize(): Promise<AgentCapabilities> {
    this.calls.push({ method: "initialize" });
    return Promise.resolve(this.capabilities);
  }

  newSession(input: { readonly cwd: string }): Promise<{ readonly sessionId: string }> {
    this.calls.push({ method: "newSession", input });
    return Promise.resolve(this.newSessionResult);
  }

  resumeSession(input: { readonly sessionId: string; readonly cwd: string }): Promise<void> {
    this.calls.push({ method: "resumeSession", input });
    return Promise.resolve();
  }

  setMode(input: { readonly sessionId: string; readonly modeId: string }): Promise<void> {
    this.calls.push({ method: "setMode", input });
    return Promise.resolve();
  }

  prompt(input: { readonly sessionId: string; readonly message: string }): Promise<PromptResponse> {
    this.calls.push({ method: "prompt", input });
    return this.promptResult;
  }

  cancel(input: { readonly sessionId: string }): Promise<void> {
    this.calls.push({ method: "cancel", input });
    return this.cancelResult;
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  update(notification: SessionNotification): void {
    this.handlers?.sessionUpdate(notification);
  }

  requestPermission(request: RequestPermissionRequest): Promise<RequestPermissionResponse> {
    if (this.handlers === undefined) throw new Error("Handlers are unavailable.");
    return this.handlers.requestPermission(request);
  }
}

function harness(connection = new FakeAcpConnection(), timing: { interruptGraceMs?: number; cancelTimeoutMs?: number; sessionEvictionMs?: number } = {}): { runtime: AcpRuntime; connection: FakeAcpConnection } {
  const runtime = new AcpRuntime({
    modeIds: { readOnly: "read-only", workspaceWrite: "agent" },
    factory: ({ handlers }) => {
      connection.handlers = handlers;
      return connection;
    },
    ...timing,
  });
  return { runtime, connection };
}

describe("ACP runtime adapter", () => {
  it("passes only the provider environment allowlist", () => {
    assert.deepEqual(acpEnvironment({ PATH: "C:\\bin", USERPROFILE: "C:\\user", GITHUB_PRIVATE_KEY: "hidden" }), {
      PATH: "C:\\bin",
      USERPROFILE: "C:\\user",
    });
  });

  it("rejects an oversized raw ACP transport line before JSON parsing", async () => {
    const bounded = new BoundedLineTransform(8);
    bounded.resume();
    const failed = once(bounded, "error");
    bounded.write(Buffer.from("123456789"));
    const [error] = await failed;
    assert.match(String(error), /byte limit/);
  });

  it("closes the SDK connection and terminates an oversized-line producer", async () => {
    const connection = new StdioAcpConnection({
      cwd: process.cwd(),
      command: process.execPath,
      args: ["-e", "process.stdout.write('x'.repeat(65)); setInterval(() => {}, 1000)"],
      maximumLineBytes: 64,
      handlers: { sessionUpdate: () => undefined, requestPermission: async () => ({ outcome: { outcome: "cancelled" } }) },
    });
    await assert.rejects(connection.initialize());
    await Promise.race([
      connection.childClosed,
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("producer remained active")), 2_000)),
    ]);
    await connection.close();
  });

  it("creates a session, streams normalized updates, and completes a turn", async () => {
    const { runtime, connection } = harness();
    let finishPrompt: ((response: PromptResponse) => void) | undefined;
    connection.promptResult = new Promise((resolve) => { finishPrompt = resolve; });
    const session = await runtime.createSession({ conversationId: opaque("conversation_1"), accessMode: "readOnly", workspace: { root: "C:\\project", kind: "project" } });
    const turn = await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Audit this project" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();

    assert.equal((await events.next()).value?.type, "turn.started");
    connection.update({
      sessionId: "acp_session_1",
      update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "Done" }, messageId: "message_1" },
    });
    connection.update({
      sessionId: "acp_session_1",
      update: { sessionUpdate: "tool_call", toolCallId: "tool_1", title: "Inspect files", kind: "read", status: "pending" },
    });
    assert.deepEqual((await events.next()).value?.payload, { delta: "Done" });
    assert.deepEqual((await events.next()).value?.payload, { toolCallId: "tool_1", title: "Inspect files", kind: "read" });
    finishPrompt?.({ stopReason: "end_turn" });
    assert.equal((await events.next()).value?.type, "message.assistant.completed");
    assert.equal((await events.next()).value?.type, "turn.completed");

    assert.equal(session.state, "idle");
    assert.equal(turn.state, "queued");
    assert.deepEqual(connection.calls.map(({ method }) => method), ["initialize", "newSession", "setMode", "prompt"]);
    assert.deepEqual(connection.calls[1]?.input, { cwd: "C:\\project" });
    assert.deepEqual(connection.calls[2]?.input, { sessionId: "acp_session_1", modeId: "read-only" });
  });

  it("enforces declared modes and trusted writable workspace policy", async () => {
    const write = harness();
    await assert.rejects(write.runtime.createSession({
      conversationId: opaque("conversation_write_wrong"),
      accessMode: "workspaceWrite",
      workspace: { root: "C:\\project", kind: "project" },
    }), (error: unknown) => error instanceof RuntimeCapabilityError && error.missing.includes("isolatedWorkspaces"));

    const isolated = harness();
    await isolated.runtime.createSession({
      conversationId: opaque("conversation_write"),
      accessMode: "workspaceWrite",
      workspace: { root: "C:\\isolated", kind: "isolated" },
    });
    assert.deepEqual(isolated.connection.calls[2]?.input, { sessionId: "acp_session_1", modeId: "agent" });

    const canonical = harness();
    await canonical.runtime.createSession({
      conversationId: opaque("conversation_canonical"),
      accessMode: "workspaceWrite",
      workspace: { root: "C:\\canonical", kind: "canonical" },
    });
    assert.deepEqual(canonical.connection.calls[2]?.input, { sessionId: "acp_session_1", modeId: "agent" });

    const unavailable = harness();
    unavailable.connection.newSessionResult = { sessionId: "no_modes" };
    await assert.rejects(unavailable.runtime.createSession({
      conversationId: opaque("conversation_no_modes"),
      accessMode: "readOnly",
      workspace: { root: "C:\\project", kind: "project" },
    }), (error: unknown) => error instanceof RuntimeCapabilityError);
    assert.equal(unavailable.connection.closed, true);
  });

  it("resumes only when the agent advertises resume", async () => {
    const supported = harness();
    await assert.rejects(supported.runtime.resumeSession({ runtimeSessionId: opaque("existing_session"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } }), /binding is unavailable/);
    const created = await supported.runtime.createSession({ conversationId: opaque("conversation_resume"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await supported.runtime.close();
    await supported.runtime.resumeSession({ runtimeSessionId: created.runtimeSessionId, accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    assert.deepEqual(supported.connection.calls.at(-2), { method: "resumeSession", input: { sessionId: "acp_session_1", cwd: "C:\\workspace" } });

    const unsupported = harness();
    const unsupportedSession = await unsupported.runtime.createSession({ conversationId: opaque("conversation_unsupported"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await unsupported.runtime.close();
    unsupported.connection.capabilities = {};
    await assert.rejects(
      unsupported.runtime.resumeSession({ runtimeSessionId: unsupportedSession.runtimeSessionId, accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } }),
      (error: unknown) => error instanceof RuntimeCapabilityError && error.missing[0] === "resume",
    );
    assert.equal(unsupported.connection.closed, true);
  });

  it("rejects cold resume in a new runtime without a trusted workspace binding", async () => {
    const beforeRestart = harness();
    const created = await beforeRestart.runtime.createSession({
      conversationId: opaque("conversation_restart"),
      accessMode: "readOnly",
      workspace: { root: "C:\\workspace", kind: "project" },
    });
    await beforeRestart.runtime.close();

    const afterRestart = harness();
    await assert.rejects(
      afterRestart.runtime.resumeSession({
        runtimeSessionId: created.runtimeSessionId,
        accessMode: "readOnly",
        workspace: { root: "C:\\workspace", kind: "project" },
      }),
      /binding is unavailable/,
    );
    assert.deepEqual(afterRestart.connection.calls, []);
  });

  it("drops provider updates and permission requests outside an active turn", async () => {
    const { runtime, connection } = harness();
    const session = await runtime.createSession({
      conversationId: opaque("conversation_idle_updates"),
      accessMode: "readOnly",
      workspace: { root: "C:\\workspace", kind: "project" },
    });
    connection.update({
      sessionId: "acp_session_1",
      update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "stale" }, messageId: "stale_message" },
    });
    const permission = await connection.requestPermission({
      sessionId: "acp_session_1",
      toolCall: { toolCallId: "stale_tool", title: "Stale permission", kind: "execute" },
      options: [{ optionId: "once", name: "Allow once", kind: "allow_once" }],
    });
    assert.deepEqual(permission, { outcome: { outcome: "cancelled" } });

    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Current turn" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    assert.equal((await events.next()).value?.type, "turn.started");
    assert.equal((await events.next()).value?.type, "turn.completed");

    connection.update({
      sessionId: "acp_session_1",
      update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "late" }, messageId: "late_message" },
    });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Next turn" });
    assert.equal((await events.next()).value?.type, "turn.started");
    assert.equal((await events.next()).value?.type, "turn.completed");
    await runtime.close();
  });

  it("cancels only the active matching turn", async () => {
    const { runtime, connection } = harness(new FakeAcpConnection(), { interruptGraceMs: 5, cancelTimeoutMs: 5 });
    connection.promptResult = new Promise(() => undefined);
    const session = await runtime.createSession({ conversationId: opaque("conversation_1"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    const turn = await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Wait" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    await runtime.interruptTurn({ runtimeSessionId: session.runtimeSessionId, runtimeTurnId: turn.runtimeTurnId });
    assert.deepEqual(connection.calls.at(-1), { method: "cancel", input: { sessionId: "acp_session_1" } });
    await assert.rejects(
      runtime.interruptTurn({ runtimeSessionId: session.runtimeSessionId, runtimeTurnId: opaque("wrong_turn") }),
      /session is unavailable|turn is unavailable/,
    );
    assert.equal((await events.next()).value?.type, "turn.started");
    assert.equal((await events.next()).value?.type, "turn.interrupted");
    assert.equal(connection.closed, true);
  });

  it("keeps permission options private and resolves the selected ACP option", async () => {
    const { runtime, connection } = harness();
    connection.promptResult = new Promise(() => undefined);
    const session = await runtime.createSession({ conversationId: opaque("conversation_1"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Run the check" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    await events.next();
    const options: PermissionOption[] = [
      { optionId: "allow", name: "Allow once", kind: "allow_once" },
      { optionId: "deny", name: "Reject once", kind: "reject_once" },
    ];
    const response = connection.requestPermission({
      sessionId: "acp_session_1",
      toolCall: { toolCallId: "tool_approval", title: "Run tests", kind: "execute", rawInput: { secret: "hidden" } },
      options,
    });
    const approval = await events.next();
    assert.equal(approval.value?.type, "approval.requested");
    assert.deepEqual(approval.value?.payload, {
      approvalId: approval.value?.payload.approvalId,
      toolCallId: "tool_approval",
      title: "Run tests",
      kind: "execute",
    });
    await runtime.resolveApproval({
      runtimeSessionId: session.runtimeSessionId,
      approvalId: opaque(String(approval.value?.payload.approvalId)),
      decision: "approve",
    });
    assert.deepEqual(await response, { outcome: { outcome: "selected", optionId: "allow" } });
  });

  it("fails closed on malformed sessions, unsupported permission choices, and prompt errors", async () => {
    const malformed = harness();
    malformed.connection.newSessionResult = { sessionId: "" };
    await assert.rejects(malformed.runtime.createSession({ conversationId: opaque("conversation_1"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } }), /malformed/);
    assert.equal(malformed.connection.closed, true);

    const { runtime, connection } = harness();
    connection.promptResult = Promise.reject(new Error("provider detail must not escape"));
    const session = await runtime.createSession({ conversationId: opaque("conversation_2"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await assert.rejects(connection.requestPermission({
      sessionId: "another_session",
      toolCall: { toolCallId: "cross_session_tool", title: "Wrong session", kind: "other" },
      options: [{ optionId: "deny", name: "Reject", kind: "reject_once" }],
    }), /malformed/);
    const turn = await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Fail safely" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    assert.equal((await events.next()).value?.type, "turn.started");
    const failed = await events.next();
    assert.deepEqual(failed.value?.payload, { turnId: String(turn.runtimeTurnId), code: "acpPromptFailed" });

    connection.promptResult = new Promise(() => undefined);
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Try permission" });
    await events.next();
    const unsupportedResponse = connection.requestPermission({
      sessionId: "acp_session_1",
      toolCall: { toolCallId: "tool_unsupported", title: "Unsupported", kind: "other" },
      options: [{ optionId: "always", name: "Always allow", kind: "allow_always" }],
    });
    const approval = await events.next();
    await assert.rejects(runtime.resolveApproval({
      runtimeSessionId: session.runtimeSessionId,
      approvalId: opaque(String(approval.value?.payload.approvalId)),
      decision: "approve",
    }), /unsupported/);
    assert.deepEqual(await unsupportedResponse, { outcome: { outcome: "cancelled" } });
    assert.equal((await events.next()).value?.type, "approval.expired");
  });

  it("bounds and sanitizes provider updates and maps non-success stop reasons to failure", async () => {
    const { runtime, connection } = harness();
    let finishPrompt: ((response: PromptResponse) => void) | undefined;
    connection.promptResult = new Promise((resolve) => { finishPrompt = resolve; });
    const session = await runtime.createSession({ conversationId: opaque("conversation_flood"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Bound output" });
    connection.update({
      sessionId: "acp_session_1",
      update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: `${"x".repeat(20_000)} C:\\private\\secret sk-example-secret-token-value` } },
    });
    const initialEvents = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    assert.equal((await initialEvents.next()).value?.type, "turn.started");
    const sanitized = await initialEvents.next();
    assert.equal(sanitized.value?.type, "message.assistant.delta");
    assert.ok(String(sanitized.value?.payload.delta).length <= 16_384);
    assert.ok(!String(sanitized.value?.payload.delta).includes("C:\\private") && !String(sanitized.value?.payload.delta).includes("sk-example"));
    for (let index = 0; index < 600; index += 1) {
      connection.update({
        sessionId: "acp_session_1",
        update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: `${"x".repeat(20_000)} C:\\private\\secret sk-example-secret-token-value-${index}` } },
      });
    }
    finishPrompt?.({ stopReason: "refusal" });
    await Promise.resolve();
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    const collected = [];
    for (let index = 0; index < 512; index += 1) {
      const event = await events.next();
      if (!event.done) collected.push(event.value);
      if (event.value?.type === "turn.failed") break;
    }
    assert.ok(collected.length <= 512);
    assert.equal(collected.at(-1)?.type, "turn.failed");
    assert.deepEqual(collected.at(-1)?.payload, { turnId: collected.at(-1)?.payload["turnId"], code: "acpEventLimitExceeded" });
  });

  it("fails the turn deterministically on a huge provider identifier", async () => {
    const { runtime, connection } = harness();
    connection.promptResult = new Promise(() => undefined);
    const session = await runtime.createSession({ conversationId: opaque("conversation_huge_id"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Inspect" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    assert.equal((await events.next()).value?.type, "turn.started");
    connection.update({ sessionId: "acp_session_1", update: { sessionUpdate: "tool_call", toolCallId: "x".repeat(257), title: "unsafe", status: "pending" } });
    const terminal = await events.next();
    assert.equal(terminal.value?.type, "turn.failed");
    assert.equal(terminal.value?.payload.code, "acpEventLimitExceeded");
    assert.equal(connection.closed, true);
    await assert.rejects(runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Second" }), /unavailable|stopping/);
  });

  it("hard-closes after cancel transport rejection", async () => {
    const connection = new FakeAcpConnection();
    connection.promptResult = new Promise(() => undefined);
    connection.cancelResult = Promise.reject(new Error("transport failed"));
    const { runtime } = harness(connection, { interruptGraceMs: 1, cancelTimeoutMs: 1 });
    const session = await runtime.createSession({ conversationId: opaque("conversation_cancel_reject"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    const turn = await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Wait" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    await runtime.interruptTurn({ runtimeSessionId: session.runtimeSessionId, runtimeTurnId: turn.runtimeTurnId });
    assert.equal(connection.closed, true);
    assert.equal((await events.next()).value?.type, "turn.started");
    assert.equal((await events.next()).value?.type, "turn.interrupted");
  });

  it("preserves approval expiry and terminal control events when a provider flood overflows", async () => {
    const { runtime, connection } = harness();
    connection.promptResult = new Promise(() => undefined);
    const session = await runtime.createSession({ conversationId: opaque("conversation_approval_flood"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Flood" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    for (let index = 0; index < 510; index += 1) {
      connection.update({ sessionId: "acp_session_1", update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: `chunk-${index}` } } });
    }
    const permission = connection.requestPermission({
      sessionId: "acp_session_1",
      toolCall: { toolCallId: "tool_needs_approval", title: "Approve safely", kind: "execute" },
      options: [{ optionId: "once", name: "Allow once", kind: "allow_once" }],
    });
    connection.update({ sessionId: "acp_session_1", update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "overflow" } } });
    assert.deepEqual(await permission, { outcome: { outcome: "cancelled" } });
    assert.equal((await events.next()).value?.type, "approval.expired");
    assert.equal((await events.next()).value?.type, "turn.failed");
  });

  it("cancels an earlier eviction timer when a new turn starts", async () => {
    const connection = new FakeAcpConnection();
    const { runtime } = harness(connection, { sessionEvictionMs: 10 });
    const session = await runtime.createSession({ conversationId: opaque("conversation_multi_turn"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "First" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    connection.promptResult = new Promise(() => undefined);
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Second" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    connection.update({ sessionId: "acp_session_1", update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "still active" } } });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    assert.equal((await events.next()).value?.type, "turn.started");
    assert.equal((await events.next()).value?.type, "turn.completed");
    assert.equal((await events.next()).value?.type, "turn.started");
    assert.equal((await events.next()).value?.type, "message.assistant.delta");
    await runtime.close();
  });

  it("rejects duplicate session identifiers and active in-process resume", async () => {
    const connection = new FakeAcpConnection();
    const { runtime } = harness(connection);
    const session = await runtime.createSession({ conversationId: opaque("conversation_duplicate_1"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await assert.rejects(runtime.createSession({ conversationId: opaque("conversation_duplicate_2"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } }), /duplicated/);
    connection.promptResult = new Promise(() => undefined);
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Wait" });
    await assert.rejects(runtime.resumeSession({ runtimeSessionId: session.runtimeSessionId, accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } }), /active/);
    await runtime.close();
  });

  it("rejects oversized retained session and message identifiers", async () => {
    const sessionConnection = new FakeAcpConnection();
    sessionConnection.newSessionResult = { sessionId: "s".repeat(257), modes: { currentModeId: "agent", availableModes: [{ id: "read-only", name: "Read-only" }] } };
    await assert.rejects(harness(sessionConnection).runtime.createSession({ conversationId: opaque("conversation_bad_session_id"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } }), /malformed/);
    const { runtime, connection } = harness();
    connection.promptResult = new Promise(() => undefined);
    const session = await runtime.createSession({ conversationId: opaque("conversation_bad_message_id"), accessMode: "readOnly", workspace: { root: "C:\\workspace", kind: "project" } });
    await runtime.startTurn({ runtimeSessionId: session.runtimeSessionId, message: "Inspect" });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    assert.equal((await events.next()).value?.type, "turn.started");
    connection.update({ sessionId: "acp_session_1", update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "unsafe" }, messageId: "m".repeat(257) } });
    assert.equal((await events.next()).value?.type, "turn.failed");
    assert.equal(connection.closed, true);
  });
});
