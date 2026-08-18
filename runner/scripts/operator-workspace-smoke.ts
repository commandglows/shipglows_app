import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import { OperatorWorkspaceGateway, type OperatorSocket } from "../src/operator-workspace/index.js";

const sessionName = `shipglows-smoke-${process.pid}`;
const marker = `SHIPGLOWS_PTY_OK_${process.pid}`;
const frames: string[] = [];
const listeners = new Map<string, (data?: unknown) => void>();
let closed: [number | undefined, string | undefined] | undefined;

const socket: OperatorSocket = {
  send(data) { frames.push(data); },
  close(code, reason) { closed = [code, reason]; },
  on(event, listener) { listeners.set(event, listener); },
};

const gateway = new OperatorWorkspaceGateway({ smoke: { cwd: process.cwd(), tmuxSession: sessionName } });

try {
  const capability = gateway.create({ tenantId: "smoke-tenant", userId: "smoke-user", projectId: "smoke", surface: "terminal", idempotencyKey: `smoke-${process.pid}` });
  assert.equal(JSON.stringify(capability).includes(process.cwd()), false);
  gateway.attach(capability.id, capability.token, socket);
  assert.equal(closed, undefined);
  listeners.get("message")?.(JSON.stringify({ type: "resize", columns: 132, rows: 36 }));
  listeners.get("message")?.(JSON.stringify({ type: "input", data: `printf '${marker} '; codex --version\r` }));

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline && !frames.some((frame) => frame.includes(marker) && /codex-cli|codex [0-9]/i.test(frame))) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const transcript = frames.join("");
  assert.match(transcript, new RegExp(marker));
  assert.match(transcript, /codex-cli|codex [0-9]/i);
  assert.doesNotMatch(transcript, /Bearer |FIREBASE_|GITHUB_PRIVATE_KEY/);
  process.stdout.write("Operator Workspace smoke passed: real PTY, isolated tmux, resize, input/output, and Codex executable.\n");
} finally {
  gateway.shutdown();
  spawnSync("tmux", ["kill-session", "-t", sessionName], { stdio: "ignore" });
}
