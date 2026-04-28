#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${VERCEL_CACHE_DIR:-$ROOT_DIR/.vercel/cache}"
FLUTTER_ROOT="${FLUTTER_ROOT:-$CACHE_DIR/flutter}"

export PATH="$FLUTTER_ROOT/bin:$PATH"

API_BASE_URL_VALUE="${API_BASE_URL:-}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
APP_SITE_URL_VALUE="${APP_SITE_URL:-}"
APP_WEB_URL_VALUE="${APP_WEB_URL:-}"
BUILD_COMMIT_SHA_VALUE="${BUILD_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-unknown}}"
BUILD_ENVIRONMENT_VALUE="${BUILD_ENVIRONMENT:-${VERCEL_ENV:-vercel}}"
BUILD_TIMESTAMP_VALUE="${BUILD_TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

DART_DEFINES=""

if [[ -n "$API_BASE_URL_VALUE" ]]; then
  DART_DEFINES="$DART_DEFINES --dart-define=API_BASE_URL=$API_BASE_URL_VALUE"
else
  echo "WARNING: API_BASE_URL not set — using Dart default (https://api.winflowz.com)" >&2
fi

if [[ -n "$CLERK_PUBLISHABLE_KEY_VALUE" ]]; then
  DART_DEFINES="$DART_DEFINES --dart-define=CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY_VALUE"
else
  echo "WARNING: CLERK_PUBLISHABLE_KEY not set — auth will not work" >&2
fi

if [[ -n "$APP_SITE_URL_VALUE" ]]; then
  DART_DEFINES="$DART_DEFINES --dart-define=APP_SITE_URL=$APP_SITE_URL_VALUE"
fi

if [[ -n "$APP_WEB_URL_VALUE" ]]; then
  DART_DEFINES="$DART_DEFINES --dart-define=APP_WEB_URL=$APP_WEB_URL_VALUE"
fi

DART_DEFINES="$DART_DEFINES --dart-define=BUILD_COMMIT_SHA=$BUILD_COMMIT_SHA_VALUE"
DART_DEFINES="$DART_DEFINES --dart-define=BUILD_ENVIRONMENT=$BUILD_ENVIRONMENT_VALUE"
DART_DEFINES="$DART_DEFINES --dart-define=BUILD_TIMESTAMP=$BUILD_TIMESTAMP_VALUE"

cd "$ROOT_DIR"

flutter --version
flutter pub get
flutter build web --release $DART_DEFINES
bash ./scripts/install-web-auth.sh "$ROOT_DIR/build/web"
