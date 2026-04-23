#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-frontend-env.sh"

if [[ ! -f "$PRAXIS_FRONTEND_PID_FILE" ]]; then
  echo "Praxis frontend is not running."
  exit 0
fi

frontend_pid="$(cat "$PRAXIS_FRONTEND_PID_FILE")"
if ! kill -0 "$frontend_pid" 2>/dev/null; then
  rm -f "$PRAXIS_FRONTEND_PID_FILE"
  echo "Removed stale frontend PID file."
  exit 0
fi

kill "$frontend_pid"

for _ in $(seq 1 50); do
  if ! kill -0 "$frontend_pid" 2>/dev/null; then
    rm -f "$PRAXIS_FRONTEND_PID_FILE"
    echo "Praxis frontend stopped."
    exit 0
  fi
  sleep 0.1
done

kill -9 "$frontend_pid" 2>/dev/null || true
rm -f "$PRAXIS_FRONTEND_PID_FILE"
echo "Praxis frontend required SIGKILL to stop."
