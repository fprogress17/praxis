#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  bash "$ROOT_DIR/scripts/stop-backend.sh" >/dev/null 2>&1 || true
}

trap cleanup EXIT

bash "$ROOT_DIR/scripts/start-backend.sh"
npx tauri dev
