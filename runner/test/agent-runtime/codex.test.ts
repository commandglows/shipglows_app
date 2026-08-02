import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CodexAppServerRuntime,
  codexEnvironment,
  type CodexConnection,
  type CodexMessage,
} from "../../src/agent-runtime/codex/index.js";
import type { OpaqueId, SafePayload } from "../../src/contracts/index.js";

class FakeConnection implements CodexConnection {
  readonly requests: { method: string; params: SafePayload }[] = [];
  readonly responses: { id: string | number; result: SafePayload }[] = [];
  readonly notificationsSent: { method: string; params: SafePayload }[] = [];
  readonly #messages: CodexMessage[] = [];
  readonly #waiters: ((message: IteratorResult<CodexMessage>) => void)[] = [];
  #closed = false;

  async request(method: string, params: SafePayload): Promise<unknown> {
    this.requests.push({ method, params });
    if (method === "thread/start") return { thread: { id: "thr_000000000001" } };
    if (method === "thread/resume") return { thread: { id: params["threadId"] } };
    if (method === "turn/start") return { turn: { id: "turn_000000000001" } };
    return {};
  }

  async notify(method: string, params: SafePayload): Promise<void> {
    this.notificationsSent.push({ method, params });
  }

  async respond(id: string | number, result: SafePayload): Promise<void> {
    this.responses.push({ id, result });
  }

  emit(message: CodexMessage): void {
    const waiter = this.#waiters.shift();
    if (waiter !== undefined) waiter({ done: false, value: message });
    else this.#messages.push(message);
  }

  async *notifications(): AsyncIterable<CodexMessage> {
    while (this.#messages.length > 0 || !this.#closed) {
      if (this.#messages.length > 0) {
        const message = this.#messages.shift();
        if (message !== undefined) yield message;
        continue;
      }
      const result = await new Promise<IteratorResult<CodexMessage>>((resolve) => this.#waiters.push(resolve));
      if (result.done) return;
      yield result.value;
    }
  }

  async close(): Promise<void> {
    this.#closed = true;
    while (this.#waiters.length > 0) this.#waiters.shift()?.({ done: true, value: undefined });
  }
}

const opaque = (value: string) => value as OpaqueId;

describe("Codex app-server runtime adapter", () => {
  it("does not inherit runner credentials into the provider process", () => {
    const environment = codexEnvironment({ PATH: "/bin", HOME: "/home/codex", GITHUB_PRIVATE_KEY: "hidden" });
    assert.deepEqual(environment, { PATH: "/bin", HOME: "/home/codex" });
  });

  it("performs the initialize handshake, starts turns, and normalizes safe semantic events", async () => {
    const connection = new FakeConnection();
    const runtime = new CodexAppServerRuntime(() => connection);
    const session = await runtime.createSession({ conversationId: opaque("cnv_000000000001") });
    const turn = await runtime.startTurn({
      runtimeSessionId: session.runtimeSessionId,
      message: "Audit the repository",
    });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();

    connection.emit({ method: "turn/started", params: { threadId: "thr_000000000001", turn: { id: "turn_000000000001" } } });
    connection.emit({ method: "item/agentMessage/delta", params: { threadId: "thr_000000000001", delta: "Done" } });
    connection.emit({ method: "item/completed", params: {
      threadId: "thr_000000000001",
      item: { id: "item_000000000001", type: "agentMessage", cwd: "/private/server/path" },
    } });
    connection.emit({ method: "turn/completed", params: {
      threadId: "thr_000000000001",
      turn: { id: "turn_000000000001", status: "completed" },
    } });

    assert.equal(session.state, "idle");
    assert.equal(turn.state, "queued");
    assert.deepEqual(connection.notificationsSent, [{ method: "initialized", params: {} }]);
    assert.deepEqual(connection.requests.map(({ method }) => method), ["initialize", "thread/start", "turn/start"]);
    assert.deepEqual((await events.next()).value?.type, "turn.started");
    const delta = await events.next();
    assert.equal(delta.value?.type, "message.assistant.delta");
    assert.equal(typeof delta.value?.occurredAt, "string");
    assert.deepEqual(delta.value?.payload, { delta: "Done" });
    const completed = await events.next();
    assert.equal(completed.value?.type, "message.assistant.completed");
    assert.deepEqual((completed.value?.payload as Record<string, unknown>), { itemId: "item_000000000001" });
    assert.equal((await events.next()).value?.type, "turn.completed");
  });

  it("keeps approval decisions server-side and answers the matching app-server request", async () => {
    const connection = new FakeConnection();
    const runtime = new CodexAppServerRuntime(() => connection);
    const session = await runtime.createSession({ conversationId: opaque("cnv_000000000001") });
    const events = runtime.events({ runtimeSessionId: session.runtimeSessionId })[Symbol.asyncIterator]();
    connection.emit({
      id: 77,
      method: "item/commandExecution/requestApproval",
      params: { threadId: "thr_000000000001", itemId: "item_approval_000001", cwd: "/private/path" },
    });
    const approval = await events.next();
    assert.deepEqual(approval.value?.payload, { approvalId: "item_approval_000001", kind: "item/commandExecution/requestApproval" });

    await runtime.resolveApproval({
      runtimeSessionId: session.runtimeSessionId,
      approvalId: opaque("item_approval_000001"),
      decision: "approve",
    });
    assert.deepEqual(connection.responses, [{ id: 77, result: { decision: "accept" } }]);
  });
});
