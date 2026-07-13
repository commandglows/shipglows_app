#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "== ShipGlowz Boundary Suite =="

failed=0

if ! ./scripts/validate-shipglowz-runtime-boundary.sh; then
  failed=1
fi

if ! ./scripts/validate-legacy-test-boundary.sh; then
  failed=1
fi

if [[ $failed -ne 0 ]]; then
  echo
  echo "FAIL Boundary suite failed. Fix legacy import violations before proceeding."
  exit 1
fi

echo
echo "PASS Boundary suite passed."
