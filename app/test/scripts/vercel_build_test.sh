#!/bin/bash

set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURE_ROOT="$(mktemp -d)"
trap 'rm -rf "$FIXTURE_ROOT"' EXIT

mkdir -p "$FIXTURE_ROOT/scripts" "$FIXTURE_ROOT/flutter/bin"
cp "$SOURCE_ROOT/scripts/vercel-build.sh" "$FIXTURE_ROOT/scripts/vercel-build.sh"

cat >"$FIXTURE_ROOT/flutter/bin/flutter" <<'EOF'
#!/bin/bash
printf '<%s>\n' "$@" >>"$BUILD_TRACE"
EOF
chmod +x "$FIXTURE_ROOT/flutter/bin/flutter"

cat >"$FIXTURE_ROOT/scripts/install-web-auth.sh" <<'EOF'
#!/bin/bash
printf '%s\n' "install-web-auth $*" >>"$BUILD_TRACE"
EOF
chmod +x "$FIXTURE_ROOT/scripts/install-web-auth.sh"

run_build() {
  local trace="$1"
  shift
  env \
    BUILD_TRACE="$trace" \
    FLUTTER_ROOT="$FIXTURE_ROOT/flutter" \
    BUILD_TIMESTAMP="2026-08-18T00:00:00Z" \
    BUILD_AT_UTC="2026-08-18 00:00 UTC" \
    BUILD_AT_PARIS="2026-08-18 02:00 Europe/Paris" \
    "$@" \
    bash "$FIXTURE_ROOT/scripts/vercel-build.sh"
}

personal_trace="$FIXTURE_ROOT/personal.trace"
run_build "$personal_trace" \
  PERSONAL_CLOUD_ENABLED=true \
  OPEN_ACCESS=true \
  API_BASE_URL=https://legacy.example \
  CLERK_PUBLISHABLE_KEY=legacy-clerk-key \
  MANAGED_RUNNER_BASE_URL=https://runner.example \
  FIREBASE_API_KEY=public-api-key \
  FIREBASE_APP_ID=app-id \
  FIREBASE_MESSAGING_SENDER_ID=sender-id \
  FIREBASE_PROJECT_ID=project-id \
  FIREBASE_AUTH_DOMAIN=project.firebaseapp.com

grep -q -- '--dart-define=OPEN_ACCESS=false' "$personal_trace"
! grep -q -- '--dart-define=API_BASE_URL=' "$personal_trace"
! grep -q -- '--dart-define=CLERK_PUBLISHABLE_KEY=' "$personal_trace"
! grep -q -- 'install-web-auth' "$personal_trace"
grep -Fxq -- '<--dart-define=BUILD_AT_PARIS=2026-08-18 02:00 Europe/Paris>' "$personal_trace"

legacy_trace="$FIXTURE_ROOT/legacy.trace"
run_build "$legacy_trace" \
  PERSONAL_CLOUD_ENABLED=false \
  API_BASE_URL=https://legacy.example \
  CLERK_PUBLISHABLE_KEY=legacy-clerk-key

grep -q -- '--dart-define=API_BASE_URL=https://legacy.example' "$legacy_trace"
grep -q -- '--dart-define=CLERK_PUBLISHABLE_KEY=legacy-clerk-key' "$legacy_trace"
grep -q -- 'install-web-auth' "$legacy_trace"

echo 'vercel-build focused tests passed'
