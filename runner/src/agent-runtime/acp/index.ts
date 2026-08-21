import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { Readable, Transform, Writable, type TransformCallback } from "node:stream";

import {
  PROTOCOL_VERSION,
  client,
  methods,
  ndJsonStream,
  type AgentCapabilities,
  type ClientConnection,
  type PermissionOption,
  type PromptResponse,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
  type SessionModeState,
} from "@agentclientprotocol/sdk";

import {
  RuntimeCapabilityError,
  assertSecretSafe,
  type AgentRuntime,
  type ApprovalDecision,
  type OpaqueId,
  type RuntimeCapability,
  type RuntimeAccessMode,
  type RuntimeEvent,
  type RuntimeSession,
  type RuntimeTurn,
  type RuntimeWorkspace,
  type SafePayload,
} from "../../contracts/index.js";

const opaque = (value: string): OpaqueId => value as OpaqueId;

class AsyncQueue<T> implements AsyncIterable<T> {
  static readonly maximumSize = 512;
  readonly #values: T[] = [];
  readonly #waiters: ((result: IteratorResult<T>) => void)[] = [];
  #closed = false;

  push(value: T): void {
    if (this.#closed) return;
    const waiter = this.#waiters.shift();
    if (waiter === undefined) {
      this.#values.push(value);
    }
    else waiter({ done: false, value });
  }

  get size(): number { return this.#values.length; }

  replace(value: T): void {
    this.#values.length = 0;
    this.push(value);
  }

  close(): void {
    this.#closed = true;
    while (this.#waiters.length > 0) this.#waiters.shift()?.({ done: true, value: undefined });
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        const value = this.#values.shift();
        if (value !== undefined) return Promise.resolve({ done: false, value });
        if (this.#closed) return Promise.resolve({ done: true, value: undefined });
        return new Promise((resolve) => this.#waiters.push(resolve));
      },
    };
  }
}

function safeEvent(type: string, payload: SafePayload): RuntimeEvent {
  assertSecretSafe(payload);
  return { type, occurredAt: new Date().toISOString(), payload };
}

const sensitiveText = /(?:(?:ghs_|gho_|github_pat_|sk-)[A-Za-z0-9_-]{8,}|eyJ[A-Za-z0-9_-]{20,})|(?:[A-Za-z]:\\|\/(?:home|Users|var|tmp)\/)[^\s"']+/g;

function safeText(value: string, maximumLength: number): string {
  return value.slice(0, maximumLength).replace(sensitiveText, "[redacted]");
}

const validProviderId = (value: string): boolean => /^[A-Za-z0-9_.:-]{1,256}$/.test(value);

export class BoundedLineTransform extends Transform {
  readonly #maximumLineBytes: number;
  #lineBytes = 0;

  constructor(maximumLineBytes = 1024 * 1024) {
    super();
    this.#maximumLineBytes = maximumLineBytes;
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    for (const byte of chunk) {
      if (byte === 0x0a) this.#lineBytes = 0;
      else {
        this.#lineBytes += 1;
        if (this.#lineBytes > this.#maximumLineBytes) {
          callback(new Error("ACP transport line exceeds the byte limit."));
          return;
        }
      }
    }
    callback(null, chunk);
  }
}

export interface AcpClientHandlers {
  readonly sessionUpdate: (notification: SessionNotification) => void;
  readonly requestPermission: (request: RequestPermissionRequest) => Promise<RequestPermissionResponse>;
}

export interface AcpConnection {
  initialize(): Promise<AgentCapabilities>;
  newSession(input: { readonly cwd: string }): Promise<{ readonly sessionId: string; readonly modes?: SessionModeState | null }>;
  resumeSession(input: { readonly sessionId: string; readonly cwd: string }): Promise<void>;
  setMode(input: { readonly sessionId: string; readonly modeId: string }): Promise<void>;
  prompt(input: { readonly sessionId: string; readonly message: string }): Promise<PromptResponse>;
  cancel(input: { readonly sessionId: string }): Promise<void>;
  close(): Promise<void>;
}

export type AcpConnectionFactory = (input: {
  readonly cwd: string;
  readonly handlers: AcpClientHandlers;
}) => AcpConnection;

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

export function acpEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const key of safeEnvironmentKeys) {
    const value = source[key];
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}

export class StdioAcpConnection implements AcpConnection {
  readonly #process: ChildProcess;
  readonly #connection: ClientConnection;
  readonly #childClosed: Promise<void>;
  #capabilities: AgentCapabilities | undefined;
  #closing: Promise<void> | undefined;

  constructor(input: {
    readonly cwd: string;
    readonly command: string;
    readonly args: readonly string[];
    readonly handlers: AcpClientHandlers;
    readonly maximumLineBytes?: number;
  }) {
    this.#process = spawn(input.command, input.args, {
      cwd: input.cwd,
      shell: false,
      stdio: ["pipe", "pipe", "ignore"],
      env: acpEnvironment(),
    });
    this.#childClosed = new Promise((resolve) => this.#process.once("exit", () => resolve()));
    const stdout = this.#process.stdout;
    const stdin = this.#process.stdin;
    if (stdout === null || stdin === null) {
      this.#process.kill();
      throw new Error("ACP stdio transport is unavailable.");
    }
    const app = client({ name: "shipglows" })
      .onRequest(methods.client.session.requestPermission, ({ params }) => input.handlers.requestPermission(params))
      .onNotification(methods.client.session.update, ({ params }) => input.handlers.sessionUpdate(params));
    const boundedStdout = stdout.pipe(new BoundedLineTransform(input.maximumLineBytes));
    this.#connection = app.connect(
      ndJsonStream(
        Writable.toWeb(stdin) as WritableStream<Uint8Array>,
        Readable.toWeb(boundedStdout) as ReadableStream<Uint8Array>,
      ),
    );
    boundedStdout.once("error", () => { void this.close(); });
    this.#process.once("error", () => { void this.close(); });
    this.#process.once("exit", () => this.#connection.close());
  }

  get childClosed(): Promise<void> { return this.#childClosed; }

  async initialize(): Promise<AgentCapabilities> {
    if (this.#capabilities !== undefined) return this.#capabilities;
    const response = await this.#connection.agent.request(methods.agent.initialize, {
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: {},
      clientInfo: { name: "shipglows", title: "ShipGlows", version: "0.1.0" },
    });
    if (response.protocolVersion !== PROTOCOL_VERSION) {
      throw new Error("ACP protocol version is unsupported.");
    }
    this.#capabilities = response.agentCapabilities ?? {};
    return this.#capabilities;
  }

  async newSession(input: { readonly cwd: string }): Promise<{ readonly sessionId: string; readonly modes?: SessionModeState | null }> {
    const response = await this.#connection.agent.request(methods.agent.session.new, { cwd: input.cwd, mcpServers: [] });
    return { sessionId: response.sessionId, ...(response.modes === undefined ? {} : { modes: response.modes }) };
  }

  async resumeSession(input: { readonly sessionId: string; readonly cwd: string }): Promise<void> {
    await this.#connection.agent.request(methods.agent.session.resume, { sessionId: input.sessionId, cwd: input.cwd, mcpServers: [] });
  }

  async setMode(input: { readonly sessionId: string; readonly modeId: string }): Promise<void> {
    await this.#connection.agent.request(methods.agent.session.setMode, input);
  }

  prompt(input: { readonly sessionId: string; readonly message: string }): Promise<PromptResponse> {
    return this.#connection.agent.request(methods.agent.session.prompt, {
      sessionId: input.sessionId,
      prompt: [{ type: "text", text: input.message }],
    });
  }

  cancel(input: { readonly sessionId: string }): Promise<void> {
    return this.#connection.agent.notify(methods.agent.session.cancel, { sessionId: input.sessionId });
  }

  close(): Promise<void> {
    this.#closing ??= (async () => {
      this.#connection.close();
      if (this.#process.exitCode === null) this.#process.kill();
      await Promise.race([this.#childClosed, new Promise<void>((resolve) => setTimeout(resolve, 500))]);
      if (this.#process.exitCode === null) {
        this.#process.kill("SIGKILL");
        await Promise.race([this.#childClosed, new Promise<void>((resolve) => setTimeout(resolve, 1_500))]);
      }
    })();
    return this.#closing;
  }
}

interface PendingPermission {
  readonly options: readonly PermissionOption[];
  readonly resolve: (response: RequestPermissionResponse) => void;
}

interface AcpSession {
  connection: AcpConnection;
  readonly cwd: string;
  readonly accessMode: RuntimeAccessMode;
  readonly workspaceKind: RuntimeWorkspace["kind"];
  readonly events: AsyncQueue<RuntimeEvent>;
  readonly pendingPermissions: Map<string, PendingPermission>;
  sessionId: string | undefined;
  currentTurnId: string | undefined;
  lastAssistantMessageId: string | undefined;
  generation: number;
  terminalEmitted: boolean;
  eventCount: number;
  eventBytes: number;
  overflowed: boolean;
  stopping: boolean;
  evictionTimer: NodeJS.Timeout | undefined;
  terminal: Promise<void>;
  resolveTerminal: (() => void) | undefined;
}

interface AcpSessionDescriptor {
  readonly cwd: string;
  readonly accessMode: RuntimeAccessMode;
  readonly workspaceKind: RuntimeWorkspace["kind"];
}

function permissionOption(options: readonly PermissionOption[], decision: ApprovalDecision): PermissionOption | undefined {
  const preferred = decision === "approve" ? ["allow_once"] : ["reject_once", "reject_always"];
  return preferred.map((kind) => options.find((option) => option.kind === kind)).find((option) => option !== undefined);
}

export class AcpRuntime implements AgentRuntime {
  readonly id: string;
  readonly capabilities: ReadonlySet<RuntimeCapability> = new Set([
    "sessions",
    "turns",
    "interrupt",
    "approvals",
    "semanticEvents",
    "isolatedWorkspaces",
  ]);
  readonly #factory: AcpConnectionFactory;
  readonly #modeIds: Readonly<Record<RuntimeAccessMode, string>>;
  readonly #sessions = new Map<string, AcpSession>();
  readonly #descriptors = new Map<string, AcpSessionDescriptor>();
  readonly #interruptGraceMs: number;
  readonly #cancelTimeoutMs: number;
  readonly #sessionEvictionMs: number;

  constructor(input: {
    readonly id?: string;
    readonly modeIds: Readonly<Record<RuntimeAccessMode, string>>;
    readonly factory: AcpConnectionFactory;
    readonly interruptGraceMs?: number;
    readonly cancelTimeoutMs?: number;
    readonly sessionEvictionMs?: number;
  }) {
    this.id = input.id ?? "acp";
    this.#modeIds = input.modeIds;
    this.#factory = input.factory;
    this.#interruptGraceMs = input.interruptGraceMs ?? 2_000;
    this.#cancelTimeoutMs = input.cancelTimeoutMs ?? 1_000;
    this.#sessionEvictionMs = input.sessionEvictionMs ?? 30_000;
  }

  #handlers(session: AcpSession): AcpClientHandlers {
    return {
      sessionUpdate: (notification) => this.#mapUpdate(session, notification),
      requestPermission: (request) => this.#requestPermission(session, request),
    };
  }

  #makeSession(workspace: RuntimeWorkspace, accessMode: RuntimeAccessMode): AcpSession {
    const session: AcpSession = {
      cwd: workspace.root,
      workspaceKind: workspace.kind,
      accessMode,
      events: new AsyncQueue<RuntimeEvent>(),
      pendingPermissions: new Map(),
      connection: undefined as unknown as AcpConnection,
      sessionId: undefined,
      currentTurnId: undefined,
      lastAssistantMessageId: undefined,
      generation: 0,
      terminalEmitted: false,
      eventCount: 0,
      eventBytes: 0,
      overflowed: false,
      stopping: false,
      evictionTimer: undefined,
      terminal: Promise.resolve(),
      resolveTerminal: undefined,
    };
    session.connection = this.#factory({ cwd: workspace.root, handlers: this.#handlers(session) });
    return session;
  }

  async #setMode(session: AcpSession, modes: SessionModeState | null | undefined): Promise<void> {
    const modeId = this.#modeIds[session.accessMode];
    if (modes?.availableModes.some((mode) => mode.id === modeId) !== true) {
      throw new RuntimeCapabilityError(this.id, [session.accessMode === "readOnly" ? "sessions" : "isolatedWorkspaces"]);
    }
    await session.connection.setMode({ sessionId: session.sessionId ?? "", modeId });
  }

  #scheduleEviction(sessionId: string, session: AcpSession): void {
    if (session.evictionTimer !== undefined) clearTimeout(session.evictionTimer);
    session.evictionTimer = setTimeout(() => {
      if (this.#sessions.get(sessionId) !== session) return;
      this.#sessions.delete(sessionId);
      session.events.close();
      void session.connection.close();
    }, this.#sessionEvictionMs);
    session.evictionTimer.unref();
  }

  #emit(session: AcpSession, event: RuntimeEvent, generation = session.generation): boolean {
    if (generation !== session.generation || session.overflowed) return false;
    const bytes = JSON.stringify(event).length;
    if (session.events.size >= AsyncQueue.maximumSize || session.eventCount >= 2_048 || session.eventBytes + bytes > 4 * 1024 * 1024) {
      this.#overflow(session, generation);
      return false;
    }
    session.eventCount += 1;
    session.eventBytes += bytes;
    session.events.push(event);
    return true;
  }

  #overflow(session: AcpSession, generation: number): void {
    if (generation !== session.generation || session.overflowed || session.stopping) return;
    session.overflowed = true;
    const turnId = session.currentTurnId;
    const expired = [...session.pendingPermissions.entries()];
    session.pendingPermissions.clear();
    if (turnId !== undefined) void this.#stopTurn(session, turnId, "turn.failed", "acpEventLimitExceeded", expired, true, 0);
  }

  async #stopTurn(session: AcpSession, turnId: string, type: "turn.failed" | "turn.interrupted", code: string, expiredPermissions: readonly (readonly [string, PendingPermission])[] = [], replace = false, graceMs = this.#interruptGraceMs): Promise<void> {
    if (session.stopping) return session.terminal;
    session.stopping = true;
    session.generation += 1;
    session.terminalEmitted = true;
    session.currentTurnId = undefined;
    try {
      await Promise.race([
        session.connection.cancel({ sessionId: session.sessionId ?? "" }).catch(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, this.#cancelTimeoutMs)),
      ]);
      if (graceMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, graceMs));
    } finally {
      await session.connection.close().catch(() => undefined);
    }
    if (session.sessionId !== undefined && this.#sessions.get(session.sessionId) === session) this.#sessions.delete(session.sessionId);
    for (const [, pending] of expiredPermissions) pending.resolve({ outcome: { outcome: "cancelled" } });
    const expiredApprovalIds = expiredPermissions.map(([approvalId]) => approvalId);
    const terminal = safeEvent(type, { turnId, code });
    if (replace) {
      const [first, ...remaining] = expiredApprovalIds;
      session.events.replace(first === undefined ? terminal : safeEvent("approval.expired", { approvalId: first }));
      for (const approvalId of remaining) session.events.push(safeEvent("approval.expired", { approvalId }));
      if (first !== undefined) session.events.push(terminal);
    } else {
      for (const approvalId of expiredApprovalIds) session.events.push(safeEvent("approval.expired", { approvalId }));
      session.events.push(terminal);
    }
    session.resolveTerminal?.();
    session.evictionTimer = setTimeout(() => session.events.close(), this.#sessionEvictionMs);
    session.evictionTimer.unref();
  }

  async #initialize(session: AcpSession, requireResume: boolean): Promise<void> {
    const capabilities = await session.connection.initialize();
    if (requireResume && capabilities.sessionCapabilities?.resume == null) {
      await session.connection.close();
      throw new RuntimeCapabilityError(this.id, ["resume"]);
    }
  }

  #requestPermission(session: AcpSession, request: RequestPermissionRequest): Promise<RequestPermissionResponse> {
    if (request.sessionId === "" || request.sessionId !== session.sessionId || !validProviderId(request.toolCall.toolCallId) || request.options.some((option) => !validProviderId(option.optionId))) {
      return Promise.reject(new Error("ACP permission request is malformed."));
    }
    if (session.currentTurnId === undefined || session.terminalEmitted || session.stopping) {
      return Promise.resolve({ outcome: { outcome: "cancelled" } });
    }
    if (session.pendingPermissions.size >= 32) {
      this.#overflow(session, session.generation);
      return Promise.resolve({ outcome: { outcome: "cancelled" } });
    }
    const approvalId = randomUUID();
    const emitted = this.#emit(session, safeEvent("approval.requested", {
      approvalId,
      toolCallId: request.toolCall.toolCallId,
      title: safeText(request.toolCall.title ?? "Tool permission", 256),
      kind: request.toolCall.kind ?? "other",
    }));
    if (!emitted) return Promise.resolve({ outcome: { outcome: "cancelled" } });
    return new Promise((resolve) => session.pendingPermissions.set(approvalId, { options: request.options, resolve }));
  }

  #mapUpdate(session: AcpSession, notification: SessionNotification): void {
    const update = notification.update;
    if (notification.sessionId === "" || notification.sessionId !== session.sessionId) return;
    if (session.currentTurnId === undefined || session.terminalEmitted || session.stopping) return;
    switch (update.sessionUpdate) {
      case "agent_message_chunk": {
        if (update.content.type !== "text") return;
        if (update.messageId !== null && update.messageId !== undefined) {
          if (!validProviderId(update.messageId)) { this.#overflow(session, session.generation); break; }
          session.lastAssistantMessageId = update.messageId;
        }
        this.#emit(session, safeEvent("message.assistant.delta", { delta: safeText(update.content.text, 16_384) }));
        break;
      }
      case "tool_call":
        if (!validProviderId(update.toolCallId)) { this.#overflow(session, session.generation); break; }
        this.#emit(session, safeEvent("tool.started", {
          toolCallId: update.toolCallId,
          title: safeText(update.title, 256),
          kind: update.kind,
        }));
        break;
      case "tool_call_update": {
        if (!validProviderId(update.toolCallId)) { this.#overflow(session, session.generation); break; }
        if (update.status === "completed") {
          this.#emit(session, safeEvent("tool.completed", { toolCallId: update.toolCallId }));
        } else if (update.status === "failed") {
          this.#emit(session, safeEvent("tool.failed", { toolCallId: safeText(update.toolCallId, 256) }));
        } else if (update.status === "in_progress") {
          this.#emit(session, safeEvent("tool.output.delta", { toolCallId: safeText(update.toolCallId, 256), status: update.status }));
        }
        break;
      }
      case "plan":
        this.#emit(session, safeEvent("plan.updated", {
          entries: update.entries.slice(0, 128).map(({ content, status }) => ({ content: safeText(content, 1_024), status })),
        }));
        break;
      default:
        break;
    }
  }

  #cancelPermissions(session: AcpSession): void {
    for (const [approvalId, pending] of session.pendingPermissions) {
      pending.resolve({ outcome: { outcome: "cancelled" } });
      this.#emit(session, safeEvent("approval.expired", { approvalId }));
    }
    session.pendingPermissions.clear();
  }

  async createSession(input: {
    readonly conversationId: OpaqueId;
    readonly accessMode: RuntimeAccessMode;
    readonly workspace: RuntimeWorkspace;
  }): Promise<RuntimeSession> {
    if (input.accessMode === "workspaceWrite" && input.workspace.kind !== "isolated" && input.workspace.kind !== "canonical") {
      throw new RuntimeCapabilityError(this.id, ["isolatedWorkspaces"]);
    }
      if (this.#sessions.size >= 64) throw new Error("ACP session limit reached.");
    const session = this.#makeSession(input.workspace, input.accessMode);
    try {
      await this.#initialize(session, false);
      const result = await session.connection.newSession({ cwd: session.cwd });
      if (!validProviderId(result.sessionId)) throw new Error("ACP session response is malformed.");
      if (this.#sessions.has(result.sessionId) || this.#descriptors.has(result.sessionId)) throw new Error("ACP session identifier is duplicated.");
      session.sessionId = result.sessionId;
      await this.#setMode(session, result.modes);
      this.#sessions.set(result.sessionId, session);
      if (this.#descriptors.size >= 256) {
        const oldest = this.#descriptors.keys().next().value;
        if (oldest !== undefined) this.#descriptors.delete(oldest);
      }
      this.#descriptors.set(result.sessionId, { cwd: session.cwd, accessMode: session.accessMode, workspaceKind: session.workspaceKind });
      return { runtimeSessionId: opaque(result.sessionId), state: "idle" };
    } catch (error) {
      await session.connection.close();
      throw error;
    }
  }

  async resumeSession(input: {
    readonly runtimeSessionId: OpaqueId;
    readonly accessMode: RuntimeAccessMode;
    readonly workspace: RuntimeWorkspace;
  }): Promise<RuntimeSession> {
    const sessionId = String(input.runtimeSessionId);
    if (sessionId.trim() === "") throw new Error("ACP session id is invalid.");
    const previous = this.#sessions.get(sessionId);
    if (previous !== undefined) {
      if (previous.cwd !== input.workspace.root || previous.accessMode !== input.accessMode || previous.workspaceKind !== input.workspace.kind) {
        throw new Error("ACP session workspace binding does not match.");
      }
      if (previous.currentTurnId !== undefined) throw new Error("ACP session is active and cannot be resumed.");
      return { runtimeSessionId: input.runtimeSessionId, state: "idle" };
    }
    const descriptor = this.#descriptors.get(sessionId);
    if (descriptor?.cwd !== input.workspace.root || descriptor.accessMode !== input.accessMode || descriptor.workspaceKind !== input.workspace.kind) {
      throw new Error("ACP session workspace binding is unavailable.");
    }
    const session = this.#makeSession(input.workspace, input.accessMode);
    try {
      await this.#initialize(session, true);
      session.sessionId = sessionId;
      await session.connection.resumeSession({ sessionId, cwd: session.cwd });
      await session.connection.setMode({ sessionId, modeId: this.#modeIds[input.accessMode] });
      this.#sessions.set(sessionId, session);
      return { runtimeSessionId: input.runtimeSessionId, state: "idle" };
    } catch (error) {
      await session.connection.close();
      throw error;
    }
  }

  startTurn(input: { readonly runtimeSessionId: OpaqueId; readonly message: string }): Promise<RuntimeTurn> {
    if (input.message.trim().length === 0 || input.message.length > 32_000) return Promise.reject(new Error("Turn message is invalid."));
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) return Promise.reject(new Error("ACP session is unavailable."));
    if (session.stopping) return Promise.reject(new Error("ACP session is stopping."));
    if (session.currentTurnId !== undefined) return Promise.reject(new Error("ACP session already has an active turn."));
    const turnId = randomUUID();
    if (session.evictionTimer !== undefined) {
      clearTimeout(session.evictionTimer);
      session.evictionTimer = undefined;
    }
    session.generation += 1;
    const generation = session.generation;
    session.terminalEmitted = false;
    session.eventCount = 0;
    session.eventBytes = 0;
    session.overflowed = false;
    session.stopping = false;
    session.terminal = new Promise((resolve) => { session.resolveTerminal = resolve; });
    session.currentTurnId = turnId;
    session.lastAssistantMessageId = undefined;
    this.#emit(session, safeEvent("turn.started", { turnId }), generation);
    void session.connection.prompt({ sessionId: String(input.runtimeSessionId), message: input.message }).then(
      (response) => {
        if (generation !== session.generation || session.terminalEmitted) return;
        this.#cancelPermissions(session);
        if (session.lastAssistantMessageId !== undefined) {
          this.#emit(session, safeEvent("message.assistant.completed", { messageId: safeText(session.lastAssistantMessageId, 256) }), generation);
        }
        const type = response.stopReason === "end_turn"
          ? "turn.completed"
          : response.stopReason === "cancelled"
            ? "turn.interrupted"
            : "turn.failed";
        session.terminalEmitted = true;
        this.#emit(session, safeEvent(type, { turnId, stopReason: response.stopReason }), generation);
        session.currentTurnId = undefined;
        session.resolveTerminal?.();
        this.#scheduleEviction(String(input.runtimeSessionId), session);
      },
      () => {
        if (generation !== session.generation || session.terminalEmitted) return;
        this.#cancelPermissions(session);
        session.terminalEmitted = true;
        this.#emit(session, safeEvent("turn.failed", { turnId, code: "acpPromptFailed" }), generation);
        session.currentTurnId = undefined;
        session.resolveTerminal?.();
        this.#scheduleEviction(String(input.runtimeSessionId), session);
      },
    );
    return Promise.resolve({ runtimeTurnId: opaque(turnId), state: "queued" });
  }

  async interruptTurn(input: { readonly runtimeSessionId: OpaqueId; readonly runtimeTurnId: OpaqueId }): Promise<void> {
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) throw new Error("ACP session is unavailable.");
    if (session.currentTurnId !== String(input.runtimeTurnId)) throw new Error("ACP turn is unavailable.");
    const expired = [...session.pendingPermissions.entries()];
    session.pendingPermissions.clear();
    await this.#stopTurn(session, String(input.runtimeTurnId), "turn.interrupted", "operatorInterrupt", expired);
  }

  resolveApproval(input: {
    readonly runtimeSessionId: OpaqueId;
    readonly approvalId: OpaqueId;
    readonly decision: ApprovalDecision;
  }): Promise<void> {
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) return Promise.reject(new Error("ACP session is unavailable."));
    const pending = session.pendingPermissions.get(String(input.approvalId));
    if (pending === undefined) return Promise.reject(new Error("ACP approval is unavailable."));
    const option = permissionOption(pending.options, input.decision);
    if (option === undefined) {
      session.pendingPermissions.delete(String(input.approvalId));
      pending.resolve({ outcome: { outcome: "cancelled" } });
      session.events.push(safeEvent("approval.expired", { approvalId: String(input.approvalId) }));
      return Promise.reject(new Error("ACP permission decision is unsupported by the agent."));
    }
    session.pendingPermissions.delete(String(input.approvalId));
    pending.resolve({ outcome: { outcome: "selected", optionId: option.optionId } });
    return Promise.resolve();
  }

  events(input: { readonly runtimeSessionId: OpaqueId }): AsyncIterable<RuntimeEvent> {
    const session = this.#sessions.get(String(input.runtimeSessionId));
    if (session === undefined) throw new Error("ACP session is unavailable.");
    return session.events;
  }

  async close(): Promise<void> {
    const sessions = [...this.#sessions.values()];
    this.#sessions.clear();
    for (const session of sessions) {
      session.generation += 1;
      if (session.evictionTimer !== undefined) clearTimeout(session.evictionTimer);
      this.#cancelPermissions(session);
      session.events.close();
    }
    await Promise.all(sessions.map((session) => session.connection.close()));
  }
}
