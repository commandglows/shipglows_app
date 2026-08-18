#!/usr/bin/env bash
set -eo pipefail
umask 077

env_file="${SHIPGLOWS_REFRESH_ENV_FILE:-${XDG_CONFIG_HOME:-$HOME/.config}/shipglows/personal-cloud-refresh.env}"
if [[ "$env_file" != /* || ! -f "$env_file" || -L "$env_file" ]]; then
  echo "refresh env must be an absolute regular non-symlink file" >&2
  exit 64
fi

env_owner="$(stat -c '%u' "$env_file")"
env_mode="$(stat -c '%a' "$env_file")"
if [[ "$env_owner" != "$(id -u)" || $((8#$env_mode & 077)) -ne 0 ]]; then
  echo "refresh env must be owned by the service user with no group/other permissions" >&2
  exit 77
fi

set -a
# shellcheck disable=SC1090 -- the absolute server-owned path is validated above.
source "$env_file"
set +a

: "${SHIPGLOWS_ROOT:?SHIPGLOWS_ROOT is required}"
if [[ "$SHIPGLOWS_ROOT" != /* || ! -f "$SHIPGLOWS_ROOT/cli/config.sh" || ! -f "$SHIPGLOWS_ROOT/cli/lib.sh" ]]; then
  echo "SHIPGLOWS_ROOT must contain the canonical ShipGlows CLI" >&2
  exit 69
fi

lock_dir="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
mkdir -p "$lock_dir"
exec 9>"$lock_dir/shipglows-personal-cloud-refresh.lock"
if ! flock -n 9; then
  exit 0
fi

# shellcheck source=/dev/null
source "$SHIPGLOWS_ROOT/cli/config.sh"
# shellcheck source=/dev/null
source "$SHIPGLOWS_ROOT/cli/lib.sh"
set -u

if [[ "${SHIPGLOWS_CLOUD_MODE:-}" != "true" \
  || "${SHIPGLOWS_PREVIEW_DOMAIN:-}" != "shipglows.com" \
  || "${SHIPGLOWS_USER_CADDY_BIND:-}" != "127.0.0.1" \
  || "${SHIPGLOWS_USER_CADDY_PORT:-}" != "8080" ]]; then
  echo "personal-cloud refresh boundary mismatch" >&2
  exit 78
fi

# Refresh generatedAt every cycle so the runner remains inside its 120-second
# TTL. Reconfigure user Caddy only when routes or process state changed; the
# existing CLI function then repeats the atomic catalog read, validates the new
# exact-Host config and preserves the previous valid state on failure.
previous_routes="$(user_caddy_routes_from_pm2 2>/dev/null || true)"
refresh_cli_project_catalog
current_routes="$(user_caddy_routes_from_pm2 2>/dev/null || true)"
caddy_running=false
if user_caddy_is_running; then caddy_running=true; fi

if [[ "$previous_routes" != "$current_routes" \
  || ( -n "$current_routes" && "$caddy_running" != "true" ) \
  || ( -z "$current_routes" && "$caddy_running" == "true" ) ]]; then
  refresh_user_caddy_from_pm2
fi
