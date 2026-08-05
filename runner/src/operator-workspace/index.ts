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

interface StoredSession extends OperatorSession {
  readonly tenantId: string;
  readonly userId: string;
  readonly pty: OperatorPty;
  attached: boolean;
  readonly idempotencyKey: string;
}

export interface OperatorSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: "message", listener: (data: unknown) => void): void;
  on(event: "close", listener: () => void): void;
}

export class OperatorWorkspaceGateway {
  private readonly sessions = new Map<string, StoredSession>();

  constructor(
    private readonly workspaces: Readonly<Record<string, OperatorWorkspaceConfig>>,
    private readonly spawn: (config: OperatorWorkspaceConfig) => OperatorPty = spawnTmuxPty,
    private readonly now: () => number = Date.now,
    private readonly lifetimeMs = 60_000,
  ) {}

  capability(projectId: string): { available: boolean; reason: string } {
    return this.workspaces[projectId] === undefined
      ? { available: false, reason: "No operator Workspace is allowlisted for this project." }
      : { available: true, reason: "A protected operator Workspace is available." };
  }

  create(input: { tenantId: string; userId: string; projectId: string; idempotencyKey: string }): OperatorSession {
    const config = this.workspaces[input.projectId];
    if (config === undefined) throw new OperatorWorkspaceError("operatorWorkspaceUnavailable", 503);
    for (const session of this.sessions.values()) {
      if (session.tenantId === input.tenantId && session.userId === input.userId && session.projectId === input.projectId && session.idempotencyKey === input.idempotencyKey && Date.parse(session.expiresAt) > this.now()) return publicSession(session);
      if (session.tenantId === input.tenantId && session.userId === input.userId && session.projectId === input.projectId) this.close(session.id);
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
      idempotencyKey: input.idempotencyKey,
    };
    this.sessions.set(session.id, session);
    return publicSession(session);
  }

  attach(sessionId: string, token: string, socket: OperatorSocket): void {
    const session = this.sessions.get(sessionId);
    if (session === undefined || !safeToken(session.token, token) || Date.parse(session.expiresAt) <= this.now() || session.attached) {
      socket.close(4403, "Workspace capability is invalid or expired.");
      return;
    }
    session.attached = true;
    const dataSubscription = session.pty.onData((data) => socket.send(JSON.stringify({ type: "output", data })));
    const exitSubscription = session.pty.onExit(() => {
      socket.send(JSON.stringify({ type: "status", state: "closed" }));
      socket.close(1000, "Workspace closed.");
      this.sessions.delete(sessionId);
    });
    socket.on("message", (raw) => {
      const message = parseMessage(raw);
      if (message?.["type"] === "input" && typeof message["data"] === "string" && message["data"].length <= 16_384) session.pty.write(message["data"]);
      if (message?.["type"] === "resize" && typeof message["columns"] === "number" && typeof message["rows"] === "number" && validSize(message["columns"], message["rows"])) session.pty.resize(message["columns"], message["rows"]);
    });
    socket.on("close", () => {
      dataSubscription.dispose();
      exitSubscription.dispose();
      session.attached = false;
    });
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
    super("The operator Workspace is unavailable.");
  }
}

function spawnTmuxPty(config: OperatorWorkspaceConfig): IPty {
  return nodePty.spawn("tmux", ["new-session", "-A", "-s", config.tmuxSession, "-c", config.cwd], {
    name: "xterm-256color",
    cols: 120,
    rows: 32,
    cwd: config.cwd,
    env: { ...process.env, TERM: "xterm-256color" },
  });
}

function publicSession(session: StoredSession): OperatorSession {
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
