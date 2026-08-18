# ShipGlows Personal Cloud — CAX11 deployment artifacts

These files prepare the Personal Cloud architecture behind Cloudflare Tunnel. They keep the runner on `127.0.0.1:3210`, the CLI-managed user Caddy on `127.0.0.1:8080`, and system Caddy as the authenticated loopback origin. After tunnel proof, public firewall access to Caddy can be removed while SSH remains separately controlled.

## Fixed topology

- `https://runner.shipglows.com` and `https://api.shipglows.com` -> Cloudflare Tunnel -> system Caddy -> runner `127.0.0.1:3210`, including the operator Workspace WebSocket.
- `https://<slug>.shipglows.com` -> Cloudflare Universal SSL -> preview session bootstrap or runner `forward_auth` -> user Caddy `127.0.0.1:8080` -> catalog-owned loopback devserver. The first-level hostname is intentional: free Universal SSL does not cover `*.preview.shipglows.com` on a full DNS zone.
- `/v1/preview/session` is the only preview-host route sent directly to the runner. `/v1/preview/authorize` and `/v1/preview/tls-ask` are never publicly routed.
- The authorization cookie and bearer header are removed before the request reaches a devserver. Caddy preserves the original Host and supports HTTP and WebSocket/HMR proxying.
- Studio remains separate and disabled in production.

## Server prerequisites and hard limits

- Node `>=22.16.0 <25`, npm, PM2, Caddy 2 with standard `forward_auth`, systemd user services, `flock`, `curl`, `ss`, tmux and the existing ShipGlows Linux CLI.
- A dedicated non-login `shipglows-workspace` Unix account owns tmux/Neovim execution. The runner account may invoke only `/usr/bin/tmux` as that account through passwordless sudo; the workspace account must not read the runner env, Firebase configuration, SQLite database, Caddy credentials, or unrelated repositories.
- During migration, the public firewall may retain TCP `80/443` as rollback. After browser, WebSocket and reboot proofs, remove public `80/443`; never expose `3210`, `8080`, or project devserver ports.
- Catalog refresh starts 30 seconds after the user manager settles and then runs 60 seconds after each completion. The service timeout is 45 seconds, below the runner reader TTL of 120 seconds; overlapping refreshes exit successfully under `flock`. User Caddy is regenerated/restarted only when the exact route set or its running state changes, so an unchanged timer tick does not churn active HMR sockets.
- Runner: one forked PM2 instance, 512 MiB restart ceiling, ten rapid restart attempts, ten-second kill timeout, two concurrent runs and a 15-minute run limit by default.
- On-demand TLS has a mandatory loopback `ask` endpoint. Caddy's deprecated `burst`/`interval` issuance limiter is intentionally not used; unknown hosts receive a non-2xx ask response and cannot obtain a certificate.

## Prepare locally on the CAX11 after separate authority

From the deployed repository's `runner` directory:

```bash
npm ci
install -d -m 0700 "$HOME/.config/shipglows"
install -m 0600 deploy/runner.env.example "$HOME/.config/shipglows/runner.env"
install -m 0600 deploy/personal-cloud-refresh.env.example "$HOME/.config/shipglows/personal-cloud-refresh.env"
```

Replace every `REPLACE_*` value in the private files. Keep the exact Firebase UID and Workspace JSON private. `npm ci` must include `tsx`, because the current runner start contract uses `node --import tsx`.

Provision the workspace identity once, after reviewing the resolved runner user and repository paths:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin shipglows-workspace
sudo install -m 0440 /dev/stdin /etc/sudoers.d/shipglows-workspace <<'EOF'
REPLACE_RUNNER_USER ALL=(shipglows-workspace) NOPASSWD: /usr/bin/tmux *
EOF
sudo visudo -cf /etc/sudoers.d/shipglows-workspace
sudo setfacl -R -m u:shipglows-workspace:rwX /home/REPLACE_OPERATOR/projects/REPLACE_ALLOWED_REPOSITORY
sudo setfacl -R -d -m u:shipglows-workspace:rwX /home/REPLACE_OPERATOR/projects/REPLACE_ALLOWED_REPOSITORY
```

Create one explicit ACL pair per allowlisted repository; never grant the account access to the operator home or the runner state/config directories. The runner launches `/usr/bin/sudo -n -H -u shipglows-workspace -- /usr/bin/tmux …` with a fixed `PATH`, locale and terminal variables only. Validate the sudoers file before restarting the runner, and remove it plus the repository ACLs to roll this isolation layer back.

Install `cloudflared` from Cloudflare's official package, authorize the zone through `cloudflared tunnel login`, and create one named tunnel. Keep the generated tunnel credential root-owned at mode `0600`; the origin certificate is an administrative credential and is not required by the running service. Copy `deploy/cloudflared/config.yml.example` to `/etc/cloudflared/config.yml`, replace only `REPLACE_TUNNEL_ID`, validate with `cloudflared --config /etc/cloudflared/config.yml tunnel ingress validate`, then install the system service. DNS must retain explicit records for `app`, `runner`, `api` and `www`; only the remaining `*.shipglows.com` wildcard points to the tunnel. This ordering keeps the Vercel-hosted app outside the preview catch-all.

Install the refresh wrapper and user units without starting them:

```bash
install -d -m 0755 "$HOME/.local/libexec/shipglows" "$HOME/.config/systemd/user"
install -m 0755 deploy/refresh-personal-cloud.sh "$HOME/.local/libexec/shipglows/refresh-personal-cloud.sh"
install -m 0644 deploy/systemd/shipglows-personal-cloud-refresh.service "$HOME/.config/systemd/user/"
install -m 0644 deploy/systemd/shipglows-personal-cloud-refresh.timer "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
```

The root Caddyfile must preserve unrelated sites and explicitly import both locations:

```caddyfile
import /etc/caddy/global-options-enabled/*.caddy
import /etc/caddy/sites-enabled/*.caddy
```

The global-options import must occur where a Caddy global block is valid. If the root file already has a global options block, merge the `on_demand_tls` stanza into that block instead of adding a second global block, then use `apply-site` so automation installs only the sites-enabled snippet. Do not run either apply command until `caddy validate` accepts the complete preserved root configuration.

## Static validation, activation and rollback

Run before any service change:

```bash
bash deploy/validate-personal-cloud.sh static
sudo bash deploy/apply-caddy-snippets.sh validate
```

After reviewing the exact target and obtaining separate CAX11 authority:

```bash
# Use `apply` with both imports, or `apply-site` after manually merging the
# exact on_demand_tls/ask stanza into an existing root global block.
sudo bash deploy/apply-caddy-snippets.sh apply
SHIPGLOWS_RUNNER_ENV_FILE="$HOME/.config/shipglows/runner.env" pm2 start deploy/ecosystem.config.cjs
pm2 save
systemctl --user enable --now shipglows-personal-cloud-refresh.timer
```

PM2 reboot persistence still requires the host-specific command printed by `pm2 startup systemd -u "$USER" --hp "$HOME"`; review that generated root command before running it. User timers require lingering when the operator has no login session: `sudo loginctl enable-linger "$USER"`.

`apply-caddy-snippets.sh apply` prints its exact backup receipt. Roll back only that bounded receipt:

```bash
sudo bash deploy/apply-caddy-snippets.sh rollback /var/backups/shipglows-personal-cloud/caddy/REPLACE_RECEIPT
systemctl --user disable --now shipglows-personal-cloud-refresh.timer
pm2 delete shipglows-runner
pm2 save
```

Rollback removes or restores only the two ShipGlows Caddy snippets. It never rewrites the root Caddyfile or unrelated sites.

## Live proof after deployment authority

```bash
bash deploy/validate-personal-cloud.sh live
systemctl --user status shipglows-personal-cloud-refresh.timer --no-pager
systemctl --user status shipglows-personal-cloud-refresh.service --no-pager
pm2 describe shipglows-runner
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo ss -ltnp
```

Then prove externally: valid TLS for runner and one catalog preview host; unauthenticated runner project access denied; unknown preview host denied during TLS; authenticated ticket POST sets a host-only Secure HttpOnly cookie; preview HTTP assets and HMR WebSocket work; cookie expiry denies; Workspace reconnect uses a fresh capability and the same tmux session; reboot restores PM2, timer, catalog, both Caddy layers and the same denial matrix. A `200` health response alone is not product proof.

## Vercel integration blocker outside this write batch

`app/scripts/vercel-build.sh` already validates the runner and Firebase variables when `PERSONAL_CLOUD_ENABLED=true`, but it still enables legacy open access when Clerk is absent and always installs dormant ClerkJS routes after the Flutter build. Before production promotion, the app-owned integration batch must make Personal Cloud fail closed with `OPEN_ACCESS=false`, stop emitting legacy Clerk/API defines for that mode, skip `install-web-auth.sh`, and retain only the runner, Firebase and build-identity defines. This deployment batch deliberately does not modify `app/**`.

## Security gate and proof limits

Applicable OWASP Top 10:2025 categories are A01 authorization, A02 Caddy/firewall/env configuration, A03 pinned Node/PM2/Caddy supply chain, A04 TLS and secret handling, A05 Host/header/path injection, A06 certificate/session abuse cases, A07 Firebase/session lifecycle, A08 catalog/config integrity, A09 redacted operational evidence and A10 rollback/reboot failures. Trust boundaries are public browser -> system Caddy -> runner/user Caddy -> loopback devserver, plus PM2/CLI -> private catalog. Local syntax and configuration checks do not prove DNS, certificates, firewall, Firebase provisioning, cookies, browser HMR, reboot recovery or hosted availability; those remain owned by the separately approved rollout.
