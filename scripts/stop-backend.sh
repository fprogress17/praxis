#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-backend-env.sh"

if [[ ! -f "$PRAXIS_BACKEND_PID_FILE" ]]; then
  echo "Praxis backend is not running."
  exit 0
fi

backend_pid="$(cat "$PRAXIS_BACKEND_PID_FILE")"
if ! kill -0 "$backend_pid" 2>/dev/null; then
  rm -f "$PRAXIS_BACKEND_PID_FILE"
  echo "Removed stale backend PID file."
  exit 0
fi

kill "$backend_pid"

for _ in $(seq 1 50); do
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    rm -f "$PRAXIS_BACKEND_PID_FILE"
    echo "Praxis backend stopped."
    exit 0
  fi
  sleep 0.1
done

kill -9 "$backend_pid" 2>/dev/null || true
rm -f "$PRAXIS_BACKEND_PID_FILE"
echo "Praxis backend required SIGKILL to stop."
