/**
 * PM2 process definition for the managed runner.
 *
 * Secrets deliberately do not live here. Before starting this process, load
 * the server-owned environment file with Supabase and GitHub App values.
 */
module.exports = {
  apps: [{
    name: "shipglows-runner",
    cwd: "/home/claude/shipglows_app/runner",
    script: "node",
    args: ["--import", "tsx", "src/main.ts"],
    env: {
      RUNNER_ENV: "production",
      RUNNER_HOST: "127.0.0.1",
      RUNNER_PORT: "3210",
      RUNNER_DB_PATH: "/home/claude/.local/share/shipglows-runner/runner.sqlite",
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false,
  }],
};
