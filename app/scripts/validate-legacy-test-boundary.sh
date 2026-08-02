#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

echo "== ShipGlows Legacy Test Boundary Check =="

set +e
matches=$(rg -n \
  "^import ['\"]package:shipglows_app/(providers/providers\\.dart|data/services/[^'\"]+|presentation/screens/[^'\"]+|presentation/widgets/[^'\"]+)['\"]" \
  test \
  --glob '!test/legacy_contract.dart')
status=$?
set -e

if [[ $status -eq 0 ]]; then
  echo "FAIL Direct legacy imports found in tests."
  echo "$matches"
  echo
  echo "Use the relative test bridge at 'test/legacy_contract.dart' for legacy test dependencies."
  echo "If a direct import is expected, document it in runtime-boundary with justification."
  exit 1
fi

echo "PASS No direct legacy imports found in test files (outside test/legacy_contract.dart)."
