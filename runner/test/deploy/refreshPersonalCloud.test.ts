import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { after, describe, it } from "node:test";

const execFileAsync = promisify(execFile);
const children: number[] = [];

after(() => {
  for (const pid of children) {
    try { process.kill(pid, "SIGTERM"); } catch {}
  }
});

describe("Personal Cloud refresh deployment", () => {
  it("does not let a background user Caddy process retain the refresh lock", async () => {
    const root = await mkdtemp(join(tmpdir(), "shipglows-refresh-test-"));
    const cliRoot = join(root, "cli-root");
    const cliDir = join(cliRoot, "cli");
    const runtimeDir = join(root, "runtime");
    const envFile = join(root, "refresh.env");
    const countFile = join(root, "refresh-count");
    const pidFile = join(root, "caddy.pid");
    await mkdir(cliDir, { recursive: true });
    await mkdir(runtimeDir, { recursive: true });
    await writeFile(join(cliDir, "config.sh"), "", { mode: 0o600 });
    await writeFile(join(cliDir, "lib.sh"), `
refresh_cli_project_catalog() {
  count=0
  [ ! -f "$TEST_COUNT_FILE" ] || count=$(sed -n '1p' "$TEST_COUNT_FILE")
  printf '%s\\n' "$((count + 1))" > "$TEST_COUNT_FILE"
}
user_caddy_routes_from_pm2() { printf '%s\\n' 'preview.example.test|3000'; }
user_caddy_is_running() {
  [ -f "$TEST_PID_FILE" ] && kill -0 "$(sed -n '1p' "$TEST_PID_FILE")" 2>/dev/null
}
refresh_user_caddy_from_pm2() {
  nohup sleep 30 >/dev/null 2>&1 &
  printf '%s\\n' "$!" > "$TEST_PID_FILE"
}
`, { mode: 0o600 });
    await writeFile(envFile, [
      `SHIPGLOWS_ROOT=${cliRoot}`,
      "SHIPGLOWS_CLOUD_MODE=true",
      "SHIPGLOWS_PREVIEW_DOMAIN=shipglows.com",
      "SHIPGLOWS_USER_CADDY_BIND=127.0.0.1",
      "SHIPGLOWS_USER_CADDY_PORT=8080",
      `TEST_COUNT_FILE=${countFile}`,
      `TEST_PID_FILE=${pidFile}`,
      "",
    ].join("\n"), { mode: 0o600 });
    await chmod(envFile, 0o600);

    const script = resolve("deploy/refresh-personal-cloud.sh");
    const env = {
      ...process.env,
      XDG_RUNTIME_DIR: runtimeDir,
      SHIPGLOWS_REFRESH_ENV_FILE: envFile,
    };
    await execFileAsync("bash", [script], { env });
    const pid = Number((await readFile(pidFile, "utf8")).trim());
    children.push(pid);
    assert.doesNotThrow(() => process.kill(pid, 0));

    await execFileAsync("bash", [script], { env });
    assert.equal((await readFile(countFile, "utf8")).trim(), "2");
  });
});
