module.exports = {
  apps: [{
    name: "shipflow_app",
    cwd: "/home/ubuntu/shipflow_app",
    script: "bash",
    args: ["-lc", "export PORT=3002 && flox activate -- doppler run -- bash -lc 'env PORT=3002 ./pm2-web.sh'"],
    env: {
      PORT: 3002
    },
    autorestart: true,
    watch: false
  }]
};
