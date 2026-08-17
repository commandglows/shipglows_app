import { randomBytes, randomUUID } from "node:crypto";
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

interface StoredSession {
  readonly id: string;
  token: string | null;
  readonly projectId: string;
  readonly expiresAt: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly pty: OperatorPty;
  attached: boolean;
  lastHeartbeatAt: number;
  readonly idempotencyKey: string;
}

export interface OperatorSocket {
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
}

export class OperatorWorkspaceGateway {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly now: () => number;
  private readonly lifetimeMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly schedule: (listener: () => void, intervalMs: number) => { dispose(): void };

  constructor(
    private workspaces: Readonly<Record<string, OperatorWorkspaceConfig>>,
    private readonly spawn: (config: OperatorWorkspaceConfig) => OperatorPty = spawnTmuxPty,
    nowOrTiming: (() => number) | OperatorWorkspaceTiming = Date.now,
    legacyLifetimeMs = 60_000,
    private readonly allowedOrigin?: string,
  ) {
    const timing = typeof nowOrTiming === "function" ? { now: nowOrTiming, capabilityLifetimeMs: legacyLifetimeMs } : nowOrTiming;
    this.now = timing.now ?? Date.now;
    this.lifetimeMs = timing.capabilityLifetimeMs ?? 60_000;
    this.heartbeatTimeoutMs = timing.heartbeatTimeoutMs ?? 30_000;
    this.schedule = timing.schedule ?? scheduleInterval;
  }

  reconcileWorkspaces(workspaces: Readonly<Record<string, OperatorWorkspaceConfig>>): void {
    this.workspaces = { ...workspaces };
  }

  capability(projectId: string): { available: boolean; reason: string } {
    return this.workspaces[projectId] === undefined
      ? { available: false, reason: "No operator Workspace is allowlisted for this project." }
      : { available: true, reason: "A protected operator Workspace is available." };
  }

  create(input: { tenantId: string; userId: string; projectId: string; idempotencyKey: string }): OperatorSession {
    const config = this.workspaces[input.projectId];
    if (config === undefined) throw new OperatorWorkspaceError("operatorWorkspaceUnavailable", 503);
    for (const session of this.sessions.values()) {
      if (session.tenantId !== input.tenantId || session.userId !== input.userId || session.projectId !== input.projectId) continue;
      if (session.attached) throw new OperatorWorkspaceError("operatorSessionActive", 409);
      if (session.idempotencyKey === input.idempotencyKey && session.token !== null && Date.parse(session.expiresAt) > this.now()) return publicSession(session);
      this.close(session.id);
    }
    const session: StoredSession = {
      id: `ops_${randomUUID()}`,
      token: randomBytes(32).toString("base64url"),
      tenantId: input.tenantId,
      userId: input.userId,
      projectId: input.projectId,
      expiresAt: new Date(this.now() + this.lifetimeMs).toISOString(),
      pty: this.spawn(config),
      attached: false,
      lastHeartbeatAt: this.now(),
      idempotencyKey: input.idempotencyKey,
    };
    this.sessions.set(session.id, session);
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
    session.lastHeartbeatAt = this.now();
    let released = false;
    const dataSubscription = session.pty.onData((data) => socket.send(JSON.stringify({ type: "output", data })));
    const exitSubscription = session.pty.onExit(() => {
      socket.send(JSON.stringify({ type: "status", state: "closed" }));
      socket.close(1000, "Workspace closed.");
      releaseAttachment();
      this.sessions.delete(sessionId);
    });
    const heartbeatSubscription = this.schedule(() => {
      if (this.now() - session.lastHeartbeatAt <= this.heartbeatTimeoutMs) return;
      socket.close(4408, "Workspace heartbeat expired.");
      releaseAttachment();
    }, Math.max(250, Math.floor(this.heartbeatTimeoutMs / 2)));
    const releaseAttachment = (): void => {
      if (released) return;
      released = true;
      dataSubscription.dispose();
      exitSubscription.dispose();
      heartbeatSubscription.dispose();
      session.attached = false;
    };
    socket.on("message", (raw) => {
      const message = parseMessage(raw);
      if (message?.["type"] === "heartbeat") {
        session.lastHeartbeatAt = this.now();
        socket.send(JSON.stringify({ type: "heartbeat", state: "alive" }));
      }
      if (message?.["type"] === "input" && typeof message["data"] === "string" && message["data"].length <= 16_384) session.pty.write(message["data"]);
      if (message?.["type"] === "resize" && typeof message["columns"] === "number" && typeof message["rows"] === "number" && validSize(message["columns"], message["rows"])) session.pty.resize(message["columns"], message["rows"]);
    });
    socket.on("close", releaseAttachment);
    socket.send(JSON.stringify({ type: "status", state: "connected" }));
  }

  close(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session === undefined) return false;
    this.sessions.delete(sessionId);
    session.pty.kill();
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
    super(code === "operatorSessionActive" ? "An operator Workspace is already attached." : "The operator Workspace is unavailable.");
  }
}

export function spawnTmuxPty(config: OperatorWorkspaceConfig): IPty {
  return nodePty.spawn("tmux", ["new-session", "-A", "-s", config.tmuxSession, "-c", config.cwd], {
    name: "xterm-256color",
    cols: 120,
    rows: 32,
    cwd: config.cwd,
    env: { ...process.env, TERM: "xterm-256color" },
  });
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
