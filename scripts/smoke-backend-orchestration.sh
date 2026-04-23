#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-backend-env.sh"

cleanup() {
  bash "$ROOT_DIR/scripts/stop-backend.sh" >/dev/null 2>&1 || true
}

trap cleanup EXIT

bash "$ROOT_DIR/scripts/stop-backend.sh" >/dev/null 2>&1 || true
bash "$ROOT_DIR/scripts/start-backend.sh"
bash "$ROOT_DIR/scripts/backend-status.sh"
curl -fsS "$PRAXIS_BACKEND_URL/health" >/dev/null
bash "$ROOT_DIR/scripts/stop-backend.sh"
bash "$ROOT_DIR/scripts/backend-status.sh" >/dev/null 2>&1 && {
  echo "Backend status unexpectedly remained healthy after stop."
  exit 1
}
echo "Backend orchestration smoke check passed."
