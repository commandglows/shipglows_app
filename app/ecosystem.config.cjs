module.exports = {
  apps: [{
    name: "shipglowz_app",
    cwd: "/home/claude/shipglowz_app/app",
    script: "bash",
    args: ["-lc", "export PORT=3010 && flox activate -- doppler run -- bash -lc 'env PORT=3010 ./pm2-web.sh'"],
    env: {
      PORT: 3010
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};
