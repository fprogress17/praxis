#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-frontend-env.sh"

frontend_pid=""
if [[ -f "$PRAXIS_FRONTEND_PID_FILE" ]]; then
  frontend_pid="$(cat "$PRAXIS_FRONTEND_PID_FILE")"
fi

if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
  if curl -fsS "$PRAXIS_FRONTEND_URL" >/dev/null 2>&1; then
    echo "Praxis frontend already running."
    echo "PID: $frontend_pid"
    echo "URL: $PRAXIS_FRONTEND_URL"
    echo "Log: $PRAXIS_FRONTEND_LOG_FILE"
    exit 0
  fi

  echo "Praxis frontend process exists but is not healthy."
  echo "PID: $frontend_pid"
  echo "Log: $PRAXIS_FRONTEND_LOG_FILE"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.next/BUILD_ID" ]]; then
  echo "Next production build not found. Run: npm run build"
  exit 1
fi

rm -f "$PRAXIS_FRONTEND_PID_FILE"
: >"$PRAXIS_FRONTEND_LOG_FILE"

nohup npx next start --hostname "$PRAXIS_FRONTEND_HOST" --port "$PRAXIS_FRONTEND_PORT" \
  >>"$PRAXIS_FRONTEND_LOG_FILE" 2>&1 &
frontend_pid="$!"
echo "$frontend_pid" >"$PRAXIS_FRONTEND_PID_FILE"

for _ in $(seq 1 60); do
  if curl -fsS "$PRAXIS_FRONTEND_URL" >/dev/null 2>&1; then
    echo "Praxis frontend started."
    echo "PID: $frontend_pid"
    echo "URL: $PRAXIS_FRONTEND_URL"
    echo "Log: $PRAXIS_FRONTEND_LOG_FILE"
    exit 0
  fi

  if ! kill -0 "$frontend_pid" 2>/dev/null; then
    echo "Praxis frontend exited during startup."
    echo "Log tail:"
    tail -n 60 "$PRAXIS_FRONTEND_LOG_FILE" || true
    rm -f "$PRAXIS_FRONTEND_PID_FILE"
    exit 1
  fi

  sleep 0.2
done

echo "Praxis frontend did not become healthy in time."
echo "PID: $frontend_pid"
echo "Log tail:"
tail -n 60 "$PRAXIS_FRONTEND_LOG_FILE" || true
exit 1
