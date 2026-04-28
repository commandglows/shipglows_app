#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${1:-$ROOT_DIR/build/web}"
SOURCE_DIR="$ROOT_DIR/web_auth"

CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
APP_WEB_URL_VALUE="${APP_WEB_URL:-https://app.contentflow.winflowz.com}"
BUILD_COMMIT_SHA_VALUE="${BUILD_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-unknown}}"
BUILD_ENVIRONMENT_VALUE="${BUILD_ENVIRONMENT:-${VERCEL_ENV:-local}}"
BUILD_TIMESTAMP_VALUE="${BUILD_TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "ERROR: build directory does not exist: $BUILD_DIR" >&2
  exit 1
fi

if [[ -z "$CLERK_PUBLISHABLE_KEY_VALUE" ]]; then
  echo "ERROR: CLERK_PUBLISHABLE_KEY is required to generate ClerkJS auth routes." >&2
  exit 1
fi

escape_replacement() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

mkdir -p "$BUILD_DIR/sign-in" "$BUILD_DIR/sign-up" "$BUILD_DIR/sso-callback"

cp "$SOURCE_DIR/sign-in.html" "$BUILD_DIR/sign-in/index.html"
cp "$SOURCE_DIR/sign-up.html" "$BUILD_DIR/sign-up/index.html"
cp "$SOURCE_DIR/sso-callback.html" "$BUILD_DIR/sso-callback/index.html"
cp "$SOURCE_DIR/clerk-auth.css" "$BUILD_DIR/clerk-auth.css"

sed \
  -e "s/__CLERK_PUBLISHABLE_KEY__/$(escape_replacement "$CLERK_PUBLISHABLE_KEY_VALUE")/g" \
  -e "s/__APP_WEB_URL__/$(escape_replacement "$APP_WEB_URL_VALUE")/g" \
  -e "s/__BUILD_COMMIT_SHA__/$(escape_replacement "$BUILD_COMMIT_SHA_VALUE")/g" \
  -e "s/__BUILD_ENVIRONMENT__/$(escape_replacement "$BUILD_ENVIRONMENT_VALUE")/g" \
  -e "s/__BUILD_TIMESTAMP__/$(escape_replacement "$BUILD_TIMESTAMP_VALUE")/g" \
  "$SOURCE_DIR/clerk-runtime.js.template" > "$BUILD_DIR/clerk-runtime.js"
