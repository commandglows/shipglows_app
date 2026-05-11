#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${VERCEL_CACHE_DIR:-$ROOT_DIR/.vercel/cache}"
FLUTTER_ROOT="${FLUTTER_ROOT:-$CACHE_DIR/flutter}"
FLUTTER_CHANNEL="${FLUTTER_CHANNEL:-stable}"

mkdir -p "$CACHE_DIR"

if [[ ! -x "$FLUTTER_ROOT/bin/flutter" ]]; then
  rm -rf "$FLUTTER_ROOT"
  git clone --depth 1 --branch "$FLUTTER_CHANNEL" https://github.com/flutter/flutter.git "$FLUTTER_ROOT"
fi

export PATH="$FLUTTER_ROOT/bin:$PATH"

flutter --version
flutter config --enable-web
flutter precache --web
