#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/home/claude/.flutter-sdk/bin:$PATH"

API_BASE_URL_VALUE="${API_BASE_URL:-https://api.winflowz.com}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
APP_SITE_URL_VALUE="${APP_SITE_URL:-https://contentflow.winflowz.com}"
APP_WEB_URL_VALUE="${APP_WEB_URL:-https://app.contentflow.winflowz.com}"
BUILD_COMMIT_SHA_VALUE="${BUILD_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"
BUILD_ENVIRONMENT_VALUE="${BUILD_ENVIRONMENT:-${VERCEL_ENV:-local-validation}}"
BUILD_TIMESTAMP_VALUE="${BUILD_TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
PORT_VALUE="${PORT:-3050}"

cd "$ROOT_DIR"

echo "== ContentFlow Clerk Runtime Validation =="
echo "Project: $ROOT_DIR"
echo "API_BASE_URL: $API_BASE_URL_VALUE"
echo "APP_SITE_URL: $APP_SITE_URL_VALUE"
echo "APP_WEB_URL: $APP_WEB_URL_VALUE"
echo "BUILD_COMMIT_SHA: $BUILD_COMMIT_SHA_VALUE"
echo "BUILD_ENVIRONMENT: $BUILD_ENVIRONMENT_VALUE"
echo "BUILD_TIMESTAMP: $BUILD_TIMESTAMP_VALUE"
echo "PORT: $PORT_VALUE"

if [[ -z "$CLERK_PUBLISHABLE_KEY_VALUE" ]]; then
  echo ""
  echo "Missing CLERK_PUBLISHABLE_KEY."
  echo "Export it, then re-run this script."
  echo ""
  echo "Example:"
  echo "  API_BASE_URL=https://api.winflowz.com \\"
  echo "  CLERK_PUBLISHABLE_KEY=pk_test_xxx \\"
  echo "  APP_SITE_URL=https://contentflow.winflowz.com \\"
  echo "  APP_WEB_URL=https://app.contentflow.winflowz.com \\"
  echo "  BUILD_COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo unknown) \\"
  echo "  BUILD_ENVIRONMENT=local-validation \\"
  echo "  PORT=3050 \\"
  echo "  ./scripts/validate-clerk-runtime.sh"
  exit 1
fi

echo ""
echo "1. Flutter toolchain"
flutter --version

echo ""
echo "2. Dependencies"
flutter pub get

echo ""
echo "3. Static analysis"
flutter analyze --no-fatal-infos --no-fatal-warnings

echo ""
echo "4. Web build with Clerk config"
flutter build web --release \
  --dart-define=API_BASE_URL="${API_BASE_URL_VALUE}" \
  --dart-define=CLERK_PUBLISHABLE_KEY="${CLERK_PUBLISHABLE_KEY_VALUE}" \
  --dart-define=APP_SITE_URL="${APP_SITE_URL_VALUE}" \
  --dart-define=APP_WEB_URL="${APP_WEB_URL_VALUE}" \
  --dart-define=BUILD_COMMIT_SHA="${BUILD_COMMIT_SHA_VALUE}" \
  --dart-define=BUILD_ENVIRONMENT="${BUILD_ENVIRONMENT_VALUE}" \
  --dart-define=BUILD_TIMESTAMP="${BUILD_TIMESTAMP_VALUE}"

echo ""
echo "5. Serving build/web on http://localhost:${PORT_VALUE}"
echo "   Eruda: append ?eruda=1 once to keep the console enabled in localStorage."
echo "   Validation flow:"
echo "   - open /entry"
echo "   - sign in with a real Clerk test account"
echo "   - verify redirect to /onboarding or /feed from /entry"
echo "   - refresh the page and confirm session restore"
echo "   - confirm /api/bootstrap loads without bouncing back to /entry"
echo ""

exec node server.js "${PORT_VALUE}"
