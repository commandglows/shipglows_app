const path = require("path");

module.exports = {
  apps: [{
    name: "contentflow-app",
    cwd: path.resolve(__dirname),
    script: "bash",
    args: ["-lc", "export PORT=3050 && flox activate -- doppler run -- ./pm2-web.sh"],
    env: {
      PORT: 3050
    },
    autorestart: true,
    watch: false
  }]
};
