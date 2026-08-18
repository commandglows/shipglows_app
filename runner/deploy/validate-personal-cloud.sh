#!/usr/bin/env bash
set -euo pipefail

mode="${1:-static}"
runner_env="${2:-${XDG_CONFIG_HOME:-$HOME/.config}/shipglows/runner.env}"
refresh_env="${3:-${XDG_CONFIG_HOME:-$HOME/.config}/shipglows/personal-cloud-refresh.env}"
deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

fail() {
  echo "validation failed: $*" >&2
  exit 1
}

for command_name in bash node caddy; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is unavailable"
done

for script in "$deploy_dir"/*.sh; do
  bash -n "$script"
done
node -e 'const config=require(process.argv[1]); if (!config.apps || config.apps.length !== 1 || config.apps[0].name !== "shipglows-runner") process.exit(1)' "$deploy_dir/ecosystem.config.cjs"
caddy validate --config "$deploy_dir/runner.shipglows.com.Caddyfile" --adapter caddyfile

for env_file in "$runner_env" "$refresh_env"; do
  [[ "$env_file" == /* && -f "$env_file" && ! -L "$env_file" ]] || fail "$env_file must be an absolute regular non-symlink file"
  [[ "$(stat -c '%u' "$env_file")" == "$(id -u)" ]] || fail "$env_file must be owned by the service user"
  env_mode="$(stat -c '%a' "$env_file")"
  (( (8#$env_mode & 077) == 0 )) || fail "$env_file must not grant group/other permissions"
  if grep -Eq 'REPLACE_[A-Z0-9_]+' "$env_file"; then fail "$env_file still contains placeholders"; fi
done

set -a
# shellcheck disable=SC1090
source "$runner_env"
# shellcheck disable=SC1090
source "$refresh_env"
set +a

[[ "${RUNNER_ENV:-}" == "production" ]] || fail "RUNNER_ENV must be production"
[[ "${RUNNER_HOST:-}" == "127.0.0.1" && "${RUNNER_PORT:-}" == "3210" ]] || fail "runner must bind 127.0.0.1:3210"
[[ "${RUNNER_ALLOWED_ORIGINS:-}" == "https://app.shipglows.com" ]] || fail "runner Origin allowlist mismatch"
[[ "${RUNNER_PERSONAL_CLOUD_ENABLED:-}" == "true" ]] || fail "Personal Cloud must be enabled"
[[ "${RUNNER_PERSONAL_CLOUD_APP_ORIGIN:-}" == "https://app.shipglows.com" ]] || fail "Personal Cloud app Origin mismatch"
[[ "${RUNNER_PREVIEW_DOMAIN:-}" == "shipglows.com" ]] || fail "preview domain mismatch"
[[ "${SHIPGLOWS_CLOUD_MODE:-}" == "true" ]] || fail "CLI cloud mode must be enabled"
[[ "${SHIPGLOWS_USER_CADDY_BIND:-}" == "127.0.0.1" && "${SHIPGLOWS_USER_CADDY_PORT:-}" == "8080" ]] || fail "user Caddy must bind 127.0.0.1:8080"
[[ "${RUNNER_CLOUD_PROJECT_CATALOG_PATH:-}" == "${SHIPGLOWS_CLI_PROJECT_CATALOG_FILE:-}" ]] || fail "runner and CLI catalog paths must match"

runner_dir="$(cd "$deploy_dir/.." && pwd -P)"
(
  cd "$runner_dir"
  node --import tsx --input-type=module -e 'import { loadConfig } from "./src/config.ts"; loadConfig(process.env);'
)

if command -v systemd-analyze >/dev/null 2>&1; then
  systemd-analyze verify "$deploy_dir/systemd/shipglows-personal-cloud-refresh.service" "$deploy_dir/systemd/shipglows-personal-cloud-refresh.timer"
fi

if [[ "$mode" == "live" ]]; then
  command -v ss >/dev/null 2>&1 || fail "ss is unavailable"
  command -v curl >/dev/null 2>&1 || fail "curl is unavailable"
  ss -ltnH | grep -Eq '127\.0\.0\.1:3210([[:space:]]|$)' || fail "runner loopback listener missing"
  ss -ltnH | grep -Eq '127\.0\.0\.1:8080([[:space:]]|$)' || fail "user Caddy loopback listener missing"
  if ss -ltnH | grep -Eq '(^|[[:space:]])(0\.0\.0\.0|\[::\]|\*):(3210|8080)([[:space:]]|$)'; then fail "private port has a public listener"; fi
  curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3210/health/live >/dev/null
elif [[ "$mode" != "static" ]]; then
  fail "mode must be static or live"
fi

echo "personal-cloud $mode validation: ok"
