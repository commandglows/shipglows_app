import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  OperatorWorkspaceGateway,
  tmuxInvocation,
  workspaceEnvironment,
  workspaceProcessInvocation,
  type OperatorPty,
  type OperatorSocket,
} from "../../src/operator-workspace/index.js";

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
  bufferedAmount = 0;
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
    const input = { tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal" as const, idempotencyKey: "request-123" };
    const first = gateway.create(input);
    const replay = gateway.create(input);
    assert.deepEqual(replay, first);
    assert.equal(JSON.stringify(first).includes("/srv/private"), false);
    assert.equal(first.token.length >= 32, true);
    assert.throws(
      () => gateway.create({ ...input, surface: "editor" }),
      (error) => error instanceof Error && "code" in error && error.code === "operatorSessionConflict",
    );
  });

  it("streams PTY output and accepts only bounded input and resize messages", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => pty, () => 1_000, 60_000, "https://app.shipglows.com");
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "request-123" });
    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket, "https://app.shipglows.com");
    socket.message(JSON.stringify({ type: "input", data: "codex\r" }));
    socket.message(JSON.stringify({ type: "resize", columns: 140, rows: 40 }));
    socket.message(JSON.stringify({ type: "resize", columns: 9999, rows: 1 }));
    pty.dataListener("ready");
    assert.deepEqual(pty.writes, ["codex\r"]);
    assert.deepEqual(pty.sizes, [[140, 40]]);
    assert.equal(socket.sent.some((frame) => frame.includes("ready")), true);
  });

  it("preserves bounded PTY output produced before the socket attaches", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => pty, () => 1_000, 60_000, "https://app.shipglows.com");
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "request-123" });
    pty.dataListener("first frame");
    pty.dataListener("second frame");

    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket, "https://app.shipglows.com");

    assert.deepEqual(socket.sent.map((frame) => JSON.parse(frame)), [
      { type: "output", data: "first frame" },
      { type: "output", data: "second frame" },
      { type: "status", state: "connected" },
    ]);
  });

  it("retires an unattached PTY when its pending output exceeds the strict bound", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => pty, () => 1_000, 60_000, "https://app.shipglows.com");
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "editor", idempotencyKey: "request-123" });
    const boundedChunk = "x".repeat(64 * 1024);
    for (let index = 0; index < 4; index += 1) pty.dataListener(boundedChunk);
    pty.dataListener("overflow");

    assert.equal(pty.killed, true);
    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket, "https://app.shipglows.com");
    assert.equal(socket.closed?.[0], 4403);
    assert.deepEqual(socket.sent, []);
  });

  it("rejects expired, invalid and second simultaneous attachments", () => {
    let now = 1_000;
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => new FakePty(), () => now, 100, "https://app.shipglows.com");
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "request-123" });
    const invalid = new FakeSocket();
    gateway.attach(session.id, "wrong", invalid, "https://app.shipglows.com");
    assert.equal(invalid.closed?.[0], 4403);
    const first = new FakeSocket();
    gateway.attach(session.id, session.token, first, "https://app.shipglows.com");
    const second = new FakeSocket();
    gateway.attach(session.id, session.token, second, "https://app.shipglows.com");
    assert.equal(second.closed?.[0], 4403);
    first.listeners.get("close")?.();
    now = 1_101;
    const expired = new FakeSocket();
    gateway.attach(session.id, session.token, expired, "https://app.shipglows.com");
    assert.equal(expired.closed?.[0], 4403);
  });

  it("allows only the owning actor to close a session", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "project" } }, () => pty);
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "request-123" });
    assert.equal(gateway.closeOwned({ sessionId: session.id, tenantId: "tenant", userId: "other" }), false);
    assert.equal(gateway.closeOwned({ sessionId: session.id, tenantId: "tenant", userId: "user" }), true);
    assert.equal(pty.killed, true);
  });

  it("requires exact Origin, consumes capabilities once and returns explicit 409 while attached", () => {
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "same-tmux" } }, () => new FakePty(), () => 1_000, 60_000, "https://app.shipglows.com");
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "first" });
    const hostile = new FakeSocket();
    gateway.attach(session.id, session.token, hostile, "https://app.shipglows.com.evil");
    assert.equal(hostile.closed?.[0], 4403);
    const first = new FakeSocket();
    gateway.attach(session.id, session.token, first, "https://app.shipglows.com");
    assert.throws(() => gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "editor", idempotencyKey: "second" }), (error) => error instanceof Error && "statusCode" in error && error.statusCode === 409);
    first.listeners.get("close")?.();
    const replay = new FakeSocket();
    gateway.attach(session.id, session.token, replay, "https://app.shipglows.com");
    assert.equal(replay.closed?.[0], 4403);
    const reattach = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "editor", idempotencyKey: "second" });
    assert.notEqual(reattach.token, session.token);
  });

  it("retires the PTY client while preserving server-owned tmux after heartbeat expiry", () => {
    let now = 1_000;
    let tick: () => void = () => undefined;
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway(
      { project: { cwd: "/srv/project", tmuxSession: "same-tmux" } },
      () => pty,
      { now: () => now, heartbeatTimeoutMs: 100, schedule: (listener) => { tick = listener; return { dispose() { return undefined; } }; } },
      60_000,
      "https://app.shipglows.com",
    );
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "first" });
    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket, "https://app.shipglows.com");
    socket.message(JSON.stringify({ type: "heartbeat" }));
    now = 1_101;
    tick();
    assert.equal(socket.closed?.[0], 4408);
    assert.equal(pty.killed, true);
    const fresh = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "fresh" });
    assert.notEqual(fresh.token, session.token);
  });

  it("reconciles newly discovered workspace mappings without killing active tmux sessions", () => {
    const firstPty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({}, () => firstPty, () => 1_000, 60_000, "https://app.shipglows.com");
    assert.equal(gateway.capability("project").available, false);
    gateway.reconcileWorkspaces({ project: { cwd: "/srv/project", tmuxSession: "same-tmux" } });
    assert.equal(gateway.capability("project").available, true);
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "fresh" });
    gateway.reconcileWorkspaces({});
    assert.equal(firstPty.killed, false);
    assert.equal(gateway.capability("project").available, false);
    assert.equal(gateway.close(session.id), true);
  });

  it("uses a fixed persistent Neovim tmux session for the editor surface", () => {
    const config = { cwd: "/srv/private/project", tmuxSession: "shipglows-project" };
    const terminal = tmuxInvocation(config, "terminal");
    const editor = tmuxInvocation(config, "editor");
    assert.deepEqual(terminal.args, ["new-session", "-A", "-s", "shipglows-project", "-c", config.cwd]);
    assert.deepEqual(editor.args, ["new-session", "-A", "-s", "shipglows-project-nvim", "-c", config.cwd, "nvim"]);
    assert.equal(editor.sessionName, "shipglows-project-nvim");
    assert.deepEqual(workspaceProcessInvocation(config, "editor", { unixUser: "shipglows-workspace" }), {
      file: "/usr/bin/sudo",
      args: ["-n", "-H", "-u", "shipglows-workspace", "--", "/usr/bin/tmux", "new-session", "-A", "-s", "shipglows-project-nvim", "-c", config.cwd, "/usr/bin/nvim"],
    });
    assert.deepEqual(workspaceEnvironment(), {
      PATH: "/usr/local/bin:/usr/bin:/bin",
      LANG: "C.UTF-8",
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
    });
  });

  it("retires the PTY and ignores input after the heartbeat lease is released", () => {
    let now = 1_000;
    let tick: () => void = () => undefined;
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway(
      { project: { cwd: "/srv/project", tmuxSession: "same-tmux" } },
      () => pty,
      { now: () => now, heartbeatTimeoutMs: 100, schedule: (listener) => { tick = listener; return { dispose() { return undefined; } }; } },
      60_000,
      "https://app.shipglows.com",
    );
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "editor", idempotencyKey: "first" });
    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket, "https://app.shipglows.com");
    now = 1_101;
    tick();
    socket.message(JSON.stringify({ type: "input", data: "should-not-run" }));
    assert.equal(pty.killed, true);
    assert.deepEqual(pty.writes, []);
  });

  it("retires a slow client before PTY output can grow without bound", () => {
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway({ project: { cwd: "/srv/project", tmuxSession: "same-tmux" } }, () => pty, () => 1_000, 60_000, "https://app.shipglows.com");
    const session = gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "editor", idempotencyKey: "first" });
    const socket = new FakeSocket();
    gateway.attach(session.id, session.token, socket, "https://app.shipglows.com");
    socket.bufferedAmount = 1024 * 1024 + 1;
    pty.dataListener("output");
    assert.equal(socket.closed?.[0], 1013);
    assert.equal(pty.killed, true);
    assert.equal(socket.sent.some((frame) => frame.includes("output")), false);
  });

  it("cleans an unattached capability when its short lifetime expires", () => {
    let now = 1_000;
    let expire: () => void = () => undefined;
    const pty = new FakePty();
    const gateway = new OperatorWorkspaceGateway(
      { project: { cwd: "/srv/project", tmuxSession: "same-tmux" } },
      () => pty,
      { now: () => now, capabilityLifetimeMs: 100, scheduleOnce: (listener) => { expire = listener; return { dispose() { return undefined; } }; } },
      100,
      "https://app.shipglows.com",
    );
    gateway.create({ tenantId: "tenant", userId: "user", projectId: "project", surface: "terminal", idempotencyKey: "first" });
    now = 1_101;
    expire();
    assert.equal(pty.killed, true);
  });
});
