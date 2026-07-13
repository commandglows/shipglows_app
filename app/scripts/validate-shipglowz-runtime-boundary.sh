#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

echo "== ShipGlowz Runtime Boundary Check =="
echo "Checking legacy imports from lib/shipglowz..."

failed=0

set +e
package_matches=$(rg -n \
  "^import ['\"]package:shipglowz_app/(providers/providers\\.dart|data/services/|presentation/|router\\.dart|web_auth/)" \
  lib/shipglowz)
package_status=$?

relative_matches=$(rg -n \
  "^import ['\"](\\.\\./){2,}(providers/providers\\.dart|data/services/|presentation/|router\\.dart|web_auth/)" \
  lib/shipglowz)
relative_status=$?
set -e

if [[ $package_status -eq 0 ]]; then
  failed=1
  echo "FAIL Legacy package imports found in lib/shipglowz:"
  echo "$package_matches"
fi

if [[ $relative_status -eq 0 ]]; then
  failed=1
  echo "FAIL Legacy relative imports found in lib/shipglowz:"
  echo "$relative_matches"
fi

if [[ $failed -ne 0 ]]; then
  echo
  echo "Use a migration/compatibility spec before wiring these legacy modules into ShipGlowz runtime."
  exit 1
fi

echo "PASS No forbidden legacy runtime imports found in lib/shipglowz."
