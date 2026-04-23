#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  bash "$ROOT_DIR/scripts/stop-desktop-runtime.sh" >/dev/null 2>&1 || true
}

trap cleanup EXIT

npm run build

export PRAXIS_DESKTOP_MANAGED_RUNTIME=1
export PRAXIS_DESKTOP_WORKDIR="$ROOT_DIR"

npx tauri dev --no-dev-server-wait --config src-tauri/tauri.runtime-dev.conf.json
