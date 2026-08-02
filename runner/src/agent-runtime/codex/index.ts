import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";

import {
  assertSecretSafe,
  type AgentRuntime,
  type ApprovalDecision,
  type OpaqueId,
  type RuntimeCapability,
  type RuntimeEvent,
  type RuntimeSession,
  type RuntimeTurn,
  type SafePayload,
} from "../../contracts/index.js";

export interface CodexMessage {
  readonly id?: string | number;
  readonly method?: string;
  readonly params?: unknown;
  readonly result?: unknown;
  readonly error?: { readonly code?: number; readonly message?: string };
}

export interface CodexConnection {
  request(method: string, params: SafePayload): Promise<unknown>;
  notify(method: string, params: SafePayload): Promise<void>;
  respond(id: string | number, result: SafePayload): Promise<void>;
  notifications(): AsyncIterable<CodexMessage>;
  close(): Promise<void>;
}

class AsyncQueue<T> implements AsyncIterable<T> {
  readonly #values: T[] = [];
  readonly #waiters: ((result: IteratorResult<T>) => void)[] = [];
  #closed = false;

  push(value: T): void {
    const waiter = this.#waiters.shift();
    if (waiter !== undefined) waiter({ done: false, value });
    else this.#values.push(value);
  }

  close(): void {
    this.#closed = true;
    while (this.#waiters.length > 0) this.#waiters.shift()?.({ done: true, value: undefined });
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (this.#values.length > 0 || !this.#closed) {
      if (this.#values.length > 0) {
        const value = this.#values.shift();
        if (value !== undefined) yield value;
        continue;
      }
      const result = await new Promise<IteratorResult<T>>((resolve) => this.#waiters.push(resolve));
      if (result.done) return;
      yield result.value;
    }
  }
}

interface PendingRequest {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function opaque(value: string): OpaqueId {
  return value as OpaqueId;
}

function requiredId(value: unknown, label: string): string {
  const id = stringValue(value);
  if (id === undefined) throw new Error(`Codex response is missing ${label}.`);
  return id;
}

function responseRecord(value: unknown): Record<string, unknown> {
  const result = record(value);
  if (result === undefined) throw new Error("Codex response is not an object.");
  return result;
}

function safeEvent(type: string, payload: SafePayload): RuntimeEvent {
  assertSecretSafe(payload);
  return { type, occurredAt: new Date().toISOString(), payload };
}

const safeEnvironmentKeys = [
  "PATH",
  "HOME",
  "USERPROFILE",
  "TMPDIR",
  "TEMP",
  "TMP",
  "LANG",
  "LC_ALL",
  "CODEX_HOME",
  "SystemRoot",
  "ComSpec",
] as const;

export function codexEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const key of safeEnvironmentKeys) {
    const value = source[key];
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}

export class StdioCodexConnection implements CodexConnection {
  readonly #process: ChildProcess;
  readonly #stdin: NodeJS.WritableStream;
  readonly #notifications = new AsyncQueue<CodexMessage>();
  readonly #pending = new Map<string | number, PendingRequest>();
  #nextId = 1;

  constructor(input: { readonly cwd: string; readonly executable?: string }) {
    this.#process = spawn(input.executable ?? "codex", ["app-server"], {
      cwd: input.cwd,
      shell: false,
      stdio: ["pipe", "pipe", "ignore"],
      env: codexEnvironment(),
    });
    const stdout = this.#process.stdout;
    const stdin = this.#process.stdin;
    if (stdout === null || stdin === null) {
      this.#process.kill();
      throw new Error("Codex app-server stdio transport is unavailable.");
    }
    this.#stdin = stdin;
    const lines = createInterface({ input: stdout });
    lines.on("line", (line) => {
      try {
        const message: unknown = JSON.parse(line);
        const parsed = record(message);
        if (parsed === undefined) return;
        const id = parsed["id"];
        if ((typeof id === "string" || typeof id === "number") && parsed["method"] === undefined) {
          const pending = this.#pending.get(id);
          if (pending === undefined) return;
          this.#pending.delete(id);
          if (parsed["error"] !== undefined) {
            const error = record(parsed["error"]);
            pending.reject(new Error(stringValue(error?.["message"]) ?? "Codex request failed."));
          } else pending.resolve(parsed["result"]);
          return;
        }
        this.#notifications.push(parsed);
      } catch {
        // Malformed provider output is intentionally ignored and never surfaced verbatim.
      }
    });
    this.#process.once("close", () => this.#notifications.close());
  }

  request(method: string, params: SafePayload): Promise<unknown> {
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#stdin.write(`${JSON.stringify({ method, id, params })}\n`);
    });
  }

  respond(id: string | number, result: SafePayload): Promise<void> {
    this.#stdin.write(`${JSON.stringify({ id, result })}\n`);
    return Promise.resolve();
  }

  notify(method: string, params: SafePayload): Promise<void> {
    this.#stdin.write(`${JSON.stringify({ method, params })}\n`);
    return Promise.resolve();
  }

  notifications(): AsyncIterable<CodexMessage> {
    return this.#notifications;
  }

  close(): Promise<void> {
    this.#notifications.close();
    this.#process.kill();
    return Promise.resolve();
  }
}

interface CodexSession {
  readonly connection: CodexConnection;
  readonly threadId: string;
  readonly events: AsyncQueue<RuntimeEvent>;
  readonly pendingApprovals: Map<string, string | number>;
}

export class CodexAppServerRuntime implements AgentRuntime {
  readonly id = "codex";
  readonly capabilities: ReadonlySet<RuntimeCapability> = new Set([
    "sessions",
    "turns",
    "resume",
    "interrupt",
    "approvals",
    "semanticEvents",
    "isolatedWorkspaces",
  ]);
  readonly #factory: (workspaceRoot?: string) => CodexConnection;
  readonly #sessions = new Map<string, CodexSession>();

  constructor(factory: (workspaceRoot?: string) => CodexConnection) {
    this.#factory = factory;
  }

  async #initialize(connection: CodexConnection): Promise<void> {
    await connection.request("initialize", {
      clientInfo: { name: "shipglows", title: "ShipGlows", version: "0.1.0" },
    });
    await connection.notify("initialized", {});
  }

  #startPump(session: CodexSession): void {
    void (async () => {
      for await (const message of session.connection.notifications()) {
        const method = message.method;
        const params = record(message.params);
        if (method === undefined || params === undefined) continue;
        const threadId = stringValue(params["threadId"]);
        if (threadId !== undefined && threadId !== session.threadId) continue;
        const event = this.#mapNotification(session, message);
        if (event !== undefined) session.events.push(event);
      }
      session.events.close();
    })();
  }

  #mapNotification(session: CodexSession, message: CodexMessage): RuntimeEvent | undefined {
    const method = message.method;
    const params = record(message.params);
    if (method === undefined || params === undefined) return undefined;
    if (method === "item/commandExecution/requestApproval" || method === "item/fileChange/requestApproval") {
      const approvalId = stringValue(params["itemId"]);
      if (approvalId === undefined || message.id === undefined) return undefined;
      session.pendingApprovals.set(approvalId, message.id);
      return safeEvent("approval.requested", { approvalId, kind: method });
    }
    if (method === "item/agentMessage/delta") {
      const delta = stringValue(params["delta"]);
      return delta === undefined ? undefined : safeEvent("message.assistant.delta", { delta });
    }
    if (method === "turn/started") {
      const turn = record(params["turn"]);
      const turnId = requiredId(turn?.["id"], "turn id");
      return safeEvent("turn.started", { turnId });
    }
    if (method === "turn/completed") {
      const turn = record(params["turn"]);
      const turnId = requiredId(turn?.["id"], "turn id");
      const status = stringValue(turn?.["status"]) ?? "completed";
      const eventType = status === "interrupted" ? "turn.interrupted" : status === "failed" ? "turn.failed" : "turn.completed";
      return safeEvent(eventType, { turnId, status });
    }
    if (method === "item/completed") {
      const item = record(params["item"]);
      const itemId = stringValue(item?.["id"]);
      const itemType = stringValue(item?.["type"]);
      if (itemId === undefined || itemType === undefined) return undefined;
      if (itemType === "commandExecution" || itemType === "mcpToolCall") return safeEvent("tool.completed", { itemId, itemType });
      if (itemType === "fileChange") return safeEvent("file.changed", { itemId });
      if (itemType === "agentMessage") return safeEvent("message.assistant.completed", { itemId });
    }
    if (method === "serverRequest/resolved") return safeEvent("approval.resolved", { requestResolved: true });
    return undefined;
  }

  async createSession(input: { readonly conversationId: OpaqueId; readonly workspaceRoot?: string }): Promise<RuntimeSession> {
    const connection = this.#factory(input.workspaceRoot);
    await this.#initialize(connection);
    const result = responseRecord(await connection.request(
      "thread/start",
      input.workspaceRoot === undefined ? {} : { cwd: input.workspaceRoot },
    ));
    const thread = responseRecord(result["thread"]);
    const threadId = requiredId(thread["id"], "thread id");
    const session: CodexSession = {
      connection,
      threadId,
      events: new AsyncQueue<RuntimeEvent>(),
      pendingApprovals: new Map(),
    };
    this.#sessions.set(threadId, session);
    this.#startPump(session);
    return { runtimeSessionId: opaque(threadId), state: "idle" };
  }

  async resumeSession(input: { readonly runtimeSessionId: OpaqueId }): Promise<RuntimeSession> {
    const connection = this.#factory();
    await this.#initialize(connection);
    const threadId = String(input.runtimeSessionId);
    await connection.request("thread/resume", { threadId });
    const session: CodexSession = {
      connection,
      threadId,
      events: new AsyncQueue<RuntimeEvent>(),
      pendingApprovals: new Map(),
    };
    this.#sessions.set(threadId, session);
    this.#startPump(session);
    return { runtimeSessionId: opaque(threadId), state: "idle" };
  }

  async startTurn(input: { readonly runtimeSessionId: OpaqueId; readonly message: string }): Promise<RuntimeTurn> {
    if (input.message.trim().length === 0 || input.message.length > 32_000) throw new Error("Turn message is invalid.");
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) throw new Error("Codex session is unavailable.");
    const result = responseRecord(await session.connection.request("turn/start", {
      threadId: session.threadId,
      input: [{ type: "text", text: input.message }],
    }));
    const turn = responseRecord(result["turn"]);
    return { runtimeTurnId: opaque(requiredId(turn["id"], "turn id")), state: "queued" };
  }

  async interruptTurn(input: { readonly runtimeSessionId: OpaqueId; readonly runtimeTurnId: OpaqueId }): Promise<void> {
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) throw new Error("Codex session is unavailable.");
    await session.connection.request("turn/interrupt", { threadId: session.threadId, turnId: String(input.runtimeTurnId) });
  }

  async resolveApproval(input: {
    readonly runtimeSessionId: OpaqueId;
    readonly approvalId: OpaqueId;
    readonly decision: ApprovalDecision;
  }): Promise<void> {
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) throw new Error("Codex session is unavailable.");
    const requestId = session.pendingApprovals.get(String(input.approvalId));
    if (requestId === undefined) throw new Error("Codex approval is unavailable.");
    const decision = input.decision === "approve" ? "accept" : "decline";
    await session.connection.respond(requestId, { decision });
    session.pendingApprovals.delete(String(input.approvalId));
  }

  events(input: { readonly runtimeSessionId: OpaqueId }): AsyncIterable<RuntimeEvent> {
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) throw new Error("Codex session is unavailable.");
    return session.events;
  }

  async close(): Promise<void> {
    const sessions = [...this.#sessions.values()];
    this.#sessions.clear();
    await Promise.all(sessions.map((session) => session.connection.close()));
  }
}
