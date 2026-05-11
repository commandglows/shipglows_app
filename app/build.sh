#!/bin/bash
# Build & serve ContentFlow Flutter app
# Usage: ./build.sh [--serve]

set -euo pipefail

export PATH="/home/claude/.flutter-sdk/bin:$PATH"
cd "$(dirname "$0")"

API_BASE_URL_VALUE="${API_BASE_URL:-https://api.winflowz.com}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
APP_SITE_URL_VALUE="${APP_SITE_URL:-https://contentflow.winflowz.com}"
APP_WEB_URL_VALUE="${APP_WEB_URL:-https://app.contentflow.winflowz.com}"
BUILD_COMMIT_SHA_VALUE="${BUILD_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"
BUILD_ENVIRONMENT_VALUE="${BUILD_ENVIRONMENT:-${VERCEL_ENV:-local}}"
BUILD_TIMESTAMP_VALUE="${BUILD_TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
PORT_VALUE="${PORT:-3050}"

if [[ -z "${CLERK_PUBLISHABLE_KEY_VALUE}" ]]; then
    echo "ERROR: CLERK_PUBLISHABLE_KEY is required to build the Flutter web app." >&2
    echo "Run through Doppler or export CLERK_PUBLISHABLE_KEY before building." >&2
    exit 1
fi

echo "🔨 Building Flutter web..."
flutter pub get
flutter build web --release \
  --dart-define=API_BASE_URL="${API_BASE_URL_VALUE}" \
  --dart-define=CLERK_PUBLISHABLE_KEY="${CLERK_PUBLISHABLE_KEY_VALUE}" \
  --dart-define=APP_SITE_URL="${APP_SITE_URL_VALUE}" \
  --dart-define=APP_WEB_URL="${APP_WEB_URL_VALUE}" \
  --dart-define=BUILD_COMMIT_SHA="${BUILD_COMMIT_SHA_VALUE}" \
  --dart-define=BUILD_ENVIRONMENT="${BUILD_ENVIRONMENT_VALUE}" \
  --dart-define=BUILD_TIMESTAMP="${BUILD_TIMESTAMP_VALUE}"

bash ./scripts/install-web-auth.sh ./build/web

echo ""
echo "✅ Build complete: build/web/"

if [[ "${1:-}" == "--serve" ]]; then
    echo ""
    echo "🚀 Starting server on port ${PORT_VALUE}..."
    # Kill existing if running
    pkill -f "node.*server.js.*${PORT_VALUE}" 2>/dev/null || true
    sleep 0.5
    node server.js "${PORT_VALUE}"
fi
