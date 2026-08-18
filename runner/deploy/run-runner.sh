#!/usr/bin/env bash
set -euo pipefail
umask 077

env_file="${SHIPGLOWS_RUNNER_ENV_FILE:-${XDG_CONFIG_HOME:-$HOME/.config}/shipglows/runner.env}"
if [[ "$env_file" != /* || ! -f "$env_file" || -L "$env_file" ]]; then
  echo "runner env must be an absolute regular non-symlink file" >&2
  exit 64
fi

env_owner="$(stat -c '%u' "$env_file")"
env_mode="$(stat -c '%a' "$env_file")"
if [[ "$env_owner" != "$(id -u)" || $((8#$env_mode & 077)) -ne 0 ]]; then
  echo "runner env must be owned by the service user with no group/other permissions" >&2
  exit 77
fi

set -a
# shellcheck disable=SC1090 -- the absolute server-owned path is validated above.
source "$env_file"
set +a

runner_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
if [[ "$runner_dir" != /* || ! -f "$runner_dir/package.json" || ! -d "$runner_dir/node_modules/tsx" ]]; then
  echo "runner directory or production runtime dependencies are unavailable" >&2
  exit 69
fi

cd "$runner_dir"
exec node --import tsx src/main.ts
