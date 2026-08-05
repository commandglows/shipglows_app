import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { OperatorWorkspaceGateway, type OperatorPty, type OperatorSocket } from "../../src/operator-workspace/index.js";

class FakePty implements OperatorPty {
  writes: string[] = [];
  sizes: [number, number][] = [];
  killed = false;
  dataListener: (data: string) => void = () => undefined;
  exitListener: () => void = () => undefined;
  write(data: string) { this.writes.push(data); }
  resize(columns: number, rows: number) { this.sizes.push([columns, rows]); }
  kill() { this.killed = true; }
  onData(listener: (data: string) => void) { this.dataListener = listener; return { dispose() { return undefined; } }; }
  onExit(listener: () => void) { this.exitListener = listener; return { dispose() { return undefined; } }; }
}

class FakeSocket implements OperatorSocket {
  sent: string[] = [];
  closed?: [number | undefined, string | undefined];
  listeners = new Map<string, (data?: unknown) => void>();
  send(data: string) { this.sent.push(data); }
  close(code?: number, reason?: string) { this.closed = [code, reason]; }
  on(event: "message" | "close", listener: (data?: unknown) => void) { this.listeners.set(event, listener); }
  message(value: unknown) { this.listeners.get("message")?.(value); }
}

describe("OperatorWorkspaceGateway", () => {
  it("creates an opaque idempotent capability without exposing the host path", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/private/project", tmuxSession: "shipglows-project" } }, () => pty, () => 1_000);
    const input = { tenantId: "tenant", userId: "user", projectId: "project", idempotencyKey: "request-123" };
    const first = gateway.create(input);
    const replay = gateway.create(input);
    assert.deepEqual(replay, first);
    assert.equal(JSON.stringify(first).includes("/srv/private"), false);
    assert.equal(first.token.length >= 32, true);
  });

  it("streams PTY output and accepts only bounded input and resize messages", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => pty, () => 1_000);
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", idempotencyKey: "request-123" });
    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket);
    socket.message(JSON.stringify({ type: "input", data: "codex\r" }));
    socket.message(JSON.stringify({ type: "resize", columns: 140, rows: 40 }));
    socket.message(JSON.stringify({ type: "resize", columns: 9999, rows: 1 }));
    pty.dataListener("ready");
    assert.deepEqual(pty.writes, ["codex\r"]);
    assert.deepEqual(pty.sizes, [[140, 40]]);
    assert.equal(socket.sent.some((frame) => frame.includes("ready")), true);
  });

  it("rejects expired, invalid and second simultaneous attachments", () => {
    let now = 1_000;
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => new FakePty(), () => now, 100);
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", idempotencyKey: "request-123" });
    const invalid = new FakeSocket();
    gateway.attach(session.id, "wrong", invalid);
    assert.equal(invalid.closed?.[0], 4403);
    const first = new FakeSocket();
    gateway.attach(session.id, session.token, first);
    const second = new FakeSocket();
    gateway.attach(session.id, session.token, second);
    assert.equal(second.closed?.[0], 4403);
    first.listeners.get("close")?.();
    now = 1_101;
    const expired = new FakeSocket();
    gateway.attach(session.id, session.token, expired);
    assert.equal(expired.closed?.[0], 4403);
  });

  it("allows only the owning actor to close a session", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => pty);
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", idempotencyKey: "request-123" });
    assert.equal(gateway.closeOwned({ sessionId: session.id, tenantId: "tenant", userId: "other" }), false);
    assert.equal(gateway.closeOwned({ sessionId: session.id, tenantId: "tenant", userId: "user" }), true);
    assert.equal(pty.killed, true);
  });
});
