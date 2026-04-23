#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-backend-env.sh"

backend_pid=""
if [[ -f "$PRAXIS_BACKEND_PID_FILE" ]]; then
  backend_pid="$(cat "$PRAXIS_BACKEND_PID_FILE")"
fi

if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
  if curl -fsS "$PRAXIS_BACKEND_URL/health" >/dev/null 2>&1; then
    echo "Praxis backend already running."
    echo "PID: $backend_pid"
    echo "URL: $PRAXIS_BACKEND_URL"
    echo "Log: $PRAXIS_BACKEND_LOG_FILE"
    exit 0
  fi

  echo "Praxis backend process exists but is not healthy."
  echo "PID: $backend_pid"
  echo "Log: $PRAXIS_BACKEND_LOG_FILE"
  exit 1
fi

rm -f "$PRAXIS_BACKEND_PID_FILE"
: >"$PRAXIS_BACKEND_LOG_FILE"

nohup node --experimental-strip-types --loader ./backend/alias-loader.mjs backend/server.ts \
  >>"$PRAXIS_BACKEND_LOG_FILE" 2>&1 &
backend_pid="$!"
echo "$backend_pid" >"$PRAXIS_BACKEND_PID_FILE"

for _ in $(seq 1 50); do
  if curl -fsS "$PRAXIS_BACKEND_URL/health" >/dev/null 2>&1; then
    echo "Praxis backend started."
    echo "PID: $backend_pid"
    echo "URL: $PRAXIS_BACKEND_URL"
    echo "Log: $PRAXIS_BACKEND_LOG_FILE"
    exit 0
  fi

  if ! kill -0 "$backend_pid" 2>/dev/null; then
    echo "Praxis backend exited during startup."
    echo "Log tail:"
    tail -n 40 "$PRAXIS_BACKEND_LOG_FILE" || true
    rm -f "$PRAXIS_BACKEND_PID_FILE"
    exit 1
  fi

  sleep 0.2
done

echo "Praxis backend did not become healthy in time."
echo "PID: $backend_pid"
echo "Log tail:"
tail -n 40 "$PRAXIS_BACKEND_LOG_FILE" || true
exit 1
