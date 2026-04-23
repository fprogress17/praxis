#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  bash "$ROOT_DIR/scripts/stop-desktop-runtime.sh" >/dev/null 2>&1 || true
}

trap cleanup EXIT

npm run build
bash "$ROOT_DIR/scripts/start-desktop-runtime.sh"
npx tauri dev --config src-tauri/tauri.runtime-dev.conf.json
