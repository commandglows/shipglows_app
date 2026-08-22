import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { IPty } from "node-pty";
import * as nodePty from "node-pty";

import type { OperatorWorkspaceConfig } from "../config.js";

export interface OperatorPty {
  write(data: string): void;
  resize(columns: number, rows: number): void;
  kill(): void;
  onData(listener: (data: string) => void): { dispose(): void };
  onExit(listener: () => void): { dispose(): void };
}

export interface OperatorSession {
  readonly id: string;
  readonly token: string;
  readonly projectId: string;
  readonly expiresAt: string;
}

export type OperatorWorkspaceSurface = "editor" | "terminal";

interface StoredSession {
  readonly id: string;
  token: string | null;
  readonly projectId: string;
  readonly surface: OperatorWorkspaceSurface;
  readonly expiresAt: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly pty: OperatorPty;
  readonly expiryTimer: { dispose(): void };
  outputData: { dispose(): void } | undefined;
  outputSink: ((data: string) => void) | undefined;
  readonly pendingOutput: string[];
  pendingOutputBytes: number;
  attached: boolean;
  lastHeartbeatAt: number;
  readonly idempotencyKey: string;
  retire: ((code?: number, reason?: string) => void) | undefined;
}

export interface OperatorSocket {
  readonly bufferedAmount?: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: "message", listener: (data: unknown) => void): void;
  on(event: "close", listener: () => void): void;
}

export interface OperatorWorkspaceTiming {
  readonly now?: () => number;
  readonly capabilityLifetimeMs?: number;
  readonly heartbeatTimeoutMs?: number;
  readonly schedule?: (listener: () => void, intervalMs: number) => { dispose(): void };
  readonly scheduleOnce?: (listener: () => void, delayMs: number) => { dispose(): void };
}

const maximumOutputChunkBytes = 64 * 1024;
const maximumPreAttachOutputBytes = 256 * 1024;
const maximumSocketBufferBytes = 1024 * 1024;

export class OperatorWorkspaceGateway {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly now: () => number;
  private readonly lifetimeMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly schedule: (listener: () => void, intervalMs: number) => { dispose(): void };
  private readonly scheduleOnce: (listener: () => void, delayMs: number) => { dispose(): void };

  constructor(
    private workspaces: Readonly<Record<string, OperatorWorkspaceConfig>>,
    private readonly spawn: (config: OperatorWorkspaceConfig, surface: OperatorWorkspaceSurface) => OperatorPty = spawnTmuxPty,
    nowOrTiming: (() => number) | OperatorWorkspaceTiming = Date.now,
    legacyLifetimeMs = 60_000,
    private readonly allowedOrigin?: string,
  ) {
    const timing = typeof nowOrTiming === "function" ? { now: nowOrTiming, capabilityLifetimeMs: legacyLifetimeMs } : nowOrTiming;
    this.now = timing.now ?? Date.now;
    this.lifetimeMs = timing.capabilityLifetimeMs ?? 60_000;
    this.heartbeatTimeoutMs = timing.heartbeatTimeoutMs ?? 30_000;
    this.schedule = timing.schedule ?? scheduleInterval;
    this.scheduleOnce = timing.scheduleOnce ?? scheduleTimeout;
  }

  reconcileWorkspaces(workspaces: Readonly<Record<string, OperatorWorkspaceConfig>>): void {
    this.workspaces = { ...workspaces };
  }

  capability(projectId: string): { available: boolean; reason: string } {
    return this.workspaces[projectId] === undefined
      ? { available: false, reason: "No operator Workspace is allowlisted for this project." }
      : { available: true, reason: "A protected operator Workspace is available." };
  }

  create(input: { tenantId: string; userId: string; projectId: string; surface: OperatorWorkspaceSurface; idempotencyKey: string }): OperatorSession {
    const config = this.workspaces[input.projectId];
    if (config === undefined) throw new OperatorWorkspaceError("operatorWorkspaceUnavailable", 503);
    for (const session of this.sessions.values()) {
      if (session.tenantId !== input.tenantId || session.userId !== input.userId || session.projectId !== input.projectId) continue;
      if (session.attached) throw new OperatorWorkspaceError("operatorSessionActive", 409);
      if (session.idempotencyKey === input.idempotencyKey) {
        if (session.surface !== input.surface) throw new OperatorWorkspaceError("operatorSessionConflict", 409);
        if (session.token !== null && Date.parse(session.expiresAt) > this.now()) return publicSession(session);
      }
      this.close(session.id);
    }
    const id = `ops_${randomUUID()}`;
    const expiresAt = new Date(this.now() + this.lifetimeMs).toISOString();
    const pty = this.spawn(config, input.surface);
    const expiryTimer = this.scheduleOnce(() => {
      const current = this.sessions.get(id);
      if (current !== undefined && current.token !== null && Date.parse(current.expiresAt) <= this.now()) this.close(id);
    }, this.lifetimeMs);
    const session: StoredSession = {
      id,
      token: randomBytes(32).toString("base64url"),
      tenantId: input.tenantId,
      userId: input.userId,
      projectId: input.projectId,
      surface: input.surface,
      expiresAt,
      pty,
      expiryTimer,
      outputData: undefined,
      outputSink: undefined,
      pendingOutput: [],
      pendingOutputBytes: 0,
      attached: false,
      lastHeartbeatAt: this.now(),
      idempotencyKey: input.idempotencyKey,
      retire: undefined,
    };
    this.sessions.set(session.id, session);
    session.outputData = pty.onData((data) => {
      if (session.outputSink !== undefined) {
        session.outputSink(data);
        return;
      }
      const dataBytes = Buffer.byteLength(data, "utf8");
      if (dataBytes > maximumOutputChunkBytes || session.pendingOutputBytes + dataBytes > maximumPreAttachOutputBytes) {
        this.close(session.id);
        return;
      }
      session.pendingOutput.push(data);
      session.pendingOutputBytes += dataBytes;
    });
    return publicSession(session);
  }

  attach(sessionId: string, token: string, socket: OperatorSocket, origin?: string): void {
    const session = this.sessions.get(sessionId);
    if (this.allowedOrigin === undefined || origin !== this.allowedOrigin) {
      socket.close(4403, "Workspace origin is not allowed.");
      return;
    }
    if (session === undefined) {
      socket.close(4403, "Workspace capability is invalid or expired.");
      return;
    }
    if (session.token === null || !safeToken(session.token, token) || Date.parse(session.expiresAt) <= this.now() || session.attached) {
      socket.close(4403, "Workspace capability is invalid or expired.");
      return;
    }
    session.attached = true;
    session.token = null;
    session.expiryTimer.dispose();
    session.lastHeartbeatAt = this.now();
    const pendingOutput = session.pendingOutput.splice(0);
    session.pendingOutputBytes = 0;
    let released = false;
    const subscriptions: {
      exit?: { dispose(): void };
      heartbeat?: { dispose(): void };
    } = {};
    const releaseAttachment = (killPty: boolean): void => {
      if (released) return;
      released = true;
      subscriptions.exit?.dispose();
      subscriptions.heartbeat?.dispose();
      session.outputData?.dispose();
      session.outputData = undefined;
      session.outputSink = undefined;
      session.attached = false;
      session.retire = undefined;
      this.sessions.delete(sessionId);
      if (killPty) session.pty.kill();
    };
    const retire = (code?: number, reason?: string): void => {
      if (released) return;
      releaseAttachment(true);
      if (code !== undefined) socket.close(code, reason);
    };
    session.retire = retire;
    const sendOutput = (data: string): void => {
      if (released) return;
      if (Buffer.byteLength(data, "utf8") > maximumOutputChunkBytes || (socket.bufferedAmount ?? 0) > maximumSocketBufferBytes) {
        retire(1013, "Workspace output exceeded the bounded client capacity.");
        return;
      }
      try {
        socket.send(JSON.stringify({ type: "output", data }));
      } catch {
        retire(1011, "Workspace stream failed.");
      }
    };
    const sendConnected = (): void => {
      if (released) return;
      try {
        socket.send(JSON.stringify({ type: "status", state: "connected" }));
      } catch {
        retire(1011, "Workspace stream failed.");
      }
    };
    session.outputSink = sendOutput;
    subscriptions.exit = session.pty.onExit(() => {
      if (released) return;
      try { socket.send(JSON.stringify({ type: "status", state: "closed" })); } catch { /* Socket is already unavailable. */ }
      releaseAttachment(false);
      socket.close(1000, "Workspace closed.");
    });
    subscriptions.heartbeat = this.schedule(() => {
      if (this.now() - session.lastHeartbeatAt <= this.heartbeatTimeoutMs) return;
      retire(4408, "Workspace heartbeat expired.");
    }, Math.max(250, Math.floor(this.heartbeatTimeoutMs / 2)));
    socket.on("message", (raw) => {
      if (released) return;
      const message = parseMessage(raw);
      if (message?.["type"] === "heartbeat") {
        session.lastHeartbeatAt = this.now();
        socket.send(JSON.stringify({ type: "heartbeat", state: "alive" }));
      }
      if (message?.["type"] === "input" && typeof message["data"] === "string" && message["data"].length <= 16_384) session.pty.write(message["data"]);
      if (message?.["type"] === "resize" && typeof message["columns"] === "number" && typeof message["rows"] === "number" && validSize(message["columns"], message["rows"])) session.pty.resize(message["columns"], message["rows"]);
    });
    socket.on("close", () => releaseAttachment(true));
    for (const data of pendingOutput) sendOutput(data);
    sendConnected();
  }

  close(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session === undefined) return false;
    if (session.retire !== undefined) session.retire(1000, "Workspace closed.");
    else {
      this.sessions.delete(sessionId);
      session.expiryTimer.dispose();
      session.outputData?.dispose();
      session.outputData = undefined;
      session.outputSink = undefined;
      session.pty.kill();
    }
    return true;
  }

  closeOwned(input: { sessionId: string; tenantId: string; userId: string }): boolean {
    const session = this.sessions.get(input.sessionId);
    if (session === undefined) return false;
    if (session.tenantId !== input.tenantId || session.userId !== input.userId) return false;
    return this.close(input.sessionId);
  }

  shutdown(): void {
    for (const sessionId of [...this.sessions.keys()]) this.close(sessionId);
  }
}

export class OperatorWorkspaceError extends Error {
  constructor(readonly code: string, readonly statusCode: number) {
    super(
      code === "operatorSessionActive"
        ? "An operator Workspace is already attached."
        : code === "operatorSessionConflict"
          ? "The operator Workspace request conflicts with an existing idempotency key."
          : "The operator Workspace is unavailable.",
    );
  }
}

export interface OperatorWorkspaceSpawnOptions {
  readonly unixUser?: string;
}

export function spawnTmuxPty(
  config: OperatorWorkspaceConfig,
  surface: OperatorWorkspaceSurface,
  options: OperatorWorkspaceSpawnOptions = {},
): IPty {
  const processInvocation = workspaceProcessInvocation(config, surface, options);
  return nodePty.spawn(processInvocation.file, processInvocation.args, {
    name: "xterm-256color",
    cols: 120,
    rows: 32,
    cwd: config.cwd,
    env: workspaceEnvironment(),
  });
}

export function workspaceProcessInvocation(
  config: OperatorWorkspaceConfig,
  surface: OperatorWorkspaceSurface,
  options: OperatorWorkspaceSpawnOptions = {},
): { readonly file: string; readonly args: string[] } {
  const isolated = options.unixUser !== undefined;
  const invocation = tmuxInvocation(config, surface, isolated ? "/usr/bin/nvim" : "nvim");
  if (!isolated) return { file: "tmux", args: invocation.args };
  return {
    file: "/usr/bin/sudo",
    args: ["-n", "-H", "-u", options.unixUser ?? "", "--", "/usr/bin/tmux", ...invocation.args],
  };
}

export function workspaceEnvironment(): Readonly<Record<string, string>> {
  return {
    PATH: "/usr/local/bin:/usr/bin:/bin",
    LANG: "C.UTF-8",
    TERM: "xterm-256color",
    COLORTERM: "truecolor",
  };
}

export function tmuxInvocation(
  config: OperatorWorkspaceConfig,
  surface: OperatorWorkspaceSurface,
  nvimExecutable = "nvim",
): { readonly args: string[]; readonly sessionName: string } {
  if (surface === "terminal") {
    return {
      args: ["new-session", "-A", "-s", config.tmuxSession, "-c", config.cwd],
      sessionName: config.tmuxSession,
    };
  }
  const sessionName = editorSessionName(config.tmuxSession);
  return {
    args: ["new-session", "-A", "-s", sessionName, "-c", config.cwd, nvimExecutable],
    sessionName,
  };
}

function editorSessionName(base: string): string {
  const direct = `${base}-nvim`;
  if (direct.length <= 64) return direct;
  const digest = createHash("sha256").update(base).digest("hex").slice(0, 8);
  return `${base.slice(0, 49)}-nvim-${digest}`;
}

function publicSession(session: StoredSession): OperatorSession {
  if (session.token === null) throw new OperatorWorkspaceError("operatorSessionActive", 409);
  return { id: session.id, token: session.token, projectId: session.projectId, expiresAt: session.expiresAt };
}

function safeToken(expected: string, received: string): boolean {
  if (expected.length !== received.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  return mismatch === 0;
}

function parseMessage(raw: unknown): Record<string, unknown> | null {
  try {
    const text = typeof raw === "string" ? raw : raw instanceof Buffer ? raw.toString("utf8") : "";
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

function validSize(columns: number, rows: number): boolean {
  return Number.isInteger(columns) && Number.isInteger(rows) && columns >= 20 && columns <= 400 && rows >= 5 && rows <= 200;
}

function scheduleInterval(listener: () => void, intervalMs: number): { dispose(): void } {
  const timer = setInterval(listener, intervalMs);
  timer.unref();
  return { dispose: () => clearInterval(timer) };
}

function scheduleTimeout(listener: () => void, delayMs: number): { dispose(): void } {
  const timer = setTimeout(listener, delayMs);
  timer.unref();
  return { dispose: () => clearTimeout(timer) };
}
