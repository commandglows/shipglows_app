"use strict";

const path = require("node:path");

const runnerDirectory = path.resolve(__dirname, "..");
const runnerEnvironmentFile = process.env.SHIPGLOWS_RUNNER_ENV_FILE
  || path.join(process.env.HOME || "/nonexistent", ".config", "shipglows", "runner.env");

module.exports = {
  apps: [{
    name: "shipglows-runner",
    cwd: runnerDirectory,
    script: "/usr/bin/bash",
    args: [path.join(__dirname, "run-runner.sh")],
    interpreter: "none",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    min_uptime: "10s",
    max_restarts: 10,
    restart_delay: 2000,
    exp_backoff_restart_delay: 100,
    max_memory_restart: "512M",
    kill_timeout: 10000,
    listen_timeout: 10000,
    time: true,
    merge_logs: true,
    env: {
      NODE_ENV: "production",
      SHIPGLOWS_RUNNER_ENV_FILE: runnerEnvironmentFile,
    },
  }],
};
