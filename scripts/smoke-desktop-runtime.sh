#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  bash "$ROOT_DIR/scripts/stop-desktop-runtime.sh" >/dev/null 2>&1 || true
}

trap cleanup EXIT

bash "$ROOT_DIR/scripts/stop-desktop-runtime.sh" >/dev/null 2>&1 || true
npm run build >/dev/null
bash "$ROOT_DIR/scripts/start-desktop-runtime.sh"
bash "$ROOT_DIR/scripts/desktop-runtime-status.sh"
curl -fsS http://127.0.0.1:${PRAXIS_BACKEND_PORT:-4001}/health >/dev/null
curl -fsS http://127.0.0.1:${PRAXIS_FRONTEND_PORT:-3007}/ >/dev/null
bash "$ROOT_DIR/scripts/stop-desktop-runtime.sh"
bash "$ROOT_DIR/scripts/desktop-runtime-status.sh" >/dev/null 2>&1 && {
  echo "Desktop runtime unexpectedly remained healthy after stop."
  exit 1
}
echo "Desktop runtime smoke check passed."
