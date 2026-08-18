#!/usr/bin/env bash
set -euo pipefail
umask 077

action="${1:-validate}"
backup_argument="${2:-}"
deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
bundle="$deploy_dir/runner.shipglows.com.Caddyfile"
source_global="$deploy_dir/caddy/00-shipglows-global.Caddyfile"
source_site="$deploy_dir/caddy/shipglows-personal-cloud.Caddyfile"
root_config="/etc/caddy/Caddyfile"
global_dir="/etc/caddy/global-options-enabled"
site_dir="/etc/caddy/sites-enabled"
target_global="$global_dir/00-shipglows-global.Caddyfile"
target_site="$site_dir/shipglows-personal-cloud.Caddyfile"
backup_root="/var/backups/shipglows-personal-cloud/caddy"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "required command unavailable: $1" >&2
    exit 69
  }
}

validate_bundle() {
  caddy validate --config "$bundle" --adapter caddyfile
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "apply and rollback require root" >&2
    exit 77
  fi
}

restore_backup() {
  local backup_dir="$1"
  if [[ -f "$backup_dir/global.absent" ]]; then
    rm -f -- "$target_global"
  else
    install -m 0644 "$backup_dir/00-shipglows-global.Caddyfile" "$target_global"
  fi
  if [[ -f "$backup_dir/site.absent" ]]; then
    rm -f -- "$target_site"
  else
    install -m 0644 "$backup_dir/shipglows-personal-cloud.Caddyfile" "$target_site"
  fi
}

require_command caddy

case "$action" in
  validate)
    validate_bundle
    ;;
  apply|apply-site)
    require_root
    [[ -f "$root_config" && ! -L "$root_config" ]] || {
      echo "root Caddyfile must be a regular non-symlink file" >&2
      exit 66
    }
    grep -Fxq 'import /etc/caddy/sites-enabled/*.caddy' "$root_config" || {
      echo "missing sites-enabled import; no file changed" >&2
      exit 78
    }
    if [[ "$action" == "apply" ]]; then
      grep -Fxq 'import /etc/caddy/global-options-enabled/*.caddy' "$root_config" || {
        echo "missing first-class global-options import; no file changed" >&2
        exit 78
      }
    else
      grep -Fq 'on_demand_tls' "$root_config" && grep -Fq 'ask http://127.0.0.1:3210/v1/preview/tls-ask' "$root_config" || {
        echo "root Caddyfile must already contain the exact on-demand TLS ask policy" >&2
        exit 78
      }
    fi
    validate_bundle
    install -d -m 0755 "$global_dir" "$site_dir" "$backup_root"
    backup_dir="$backup_root/$(date -u +%Y%m%dT%H%M%SZ)-$$"
    install -d -m 0700 "$backup_dir"
    if [[ -f "$target_global" ]]; then cp -p "$target_global" "$backup_dir/00-shipglows-global.Caddyfile"; else : > "$backup_dir/global.absent"; fi
    if [[ -f "$target_site" ]]; then cp -p "$target_site" "$backup_dir/shipglows-personal-cloud.Caddyfile"; else : > "$backup_dir/site.absent"; fi
    if [[ "$action" == "apply" ]]; then install -m 0644 "$source_global" "$target_global"; fi
    install -m 0644 "$source_site" "$target_site"
    if ! caddy validate --config "$root_config" --adapter caddyfile || ! systemctl reload caddy; then
      restore_backup "$backup_dir"
      caddy validate --config "$root_config" --adapter caddyfile >/dev/null
      systemctl reload caddy
      echo "Caddy apply failed; previous ShipGlows snippets restored" >&2
      exit 1
    fi
    printf 'Caddy snippets applied (%s); rollback directory: %s\n' "$action" "$backup_dir"
    ;;
  rollback)
    require_root
    [[ -n "$backup_argument" ]] || {
      echo "usage: $0 rollback /var/backups/shipglows-personal-cloud/caddy/<receipt>" >&2
      exit 64
    }
    backup_root_real="$(realpath -e "$backup_root")"
    backup_real="$(realpath -e "$backup_argument")"
    [[ "$backup_real" == "$backup_root_real"/* && -d "$backup_real" && ! -L "$backup_argument" ]] || {
      echo "rollback directory is outside the bounded backup root" >&2
      exit 77
    }
    restore_backup "$backup_real"
    caddy validate --config "$root_config" --adapter caddyfile
    systemctl reload caddy
    printf 'Caddy snippets rolled back from: %s\n' "$backup_real"
    ;;
  *)
    echo "usage: $0 validate|apply|apply-site|rollback [backup-directory]" >&2
    exit 64
    ;;
esac
