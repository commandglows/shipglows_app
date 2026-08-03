module.exports = {
  apps: [{
    name: "shipglows-site",
    cwd: "/home/claude/shipglows_app/site",
    script: "bash",
    args: ["-lc", "export PORT=3015 && flox activate -- bash -lc 'pnpm dev --port 3015'"],
    env: {
      PORT: 3015
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};
