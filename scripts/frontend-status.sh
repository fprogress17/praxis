#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-frontend-env.sh"

frontend_pid=""
if [[ -f "$PRAXIS_FRONTEND_PID_FILE" ]]; then
  frontend_pid="$(cat "$PRAXIS_FRONTEND_PID_FILE")"
fi

running="no"
if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
  running="yes"
fi

healthy="no"
if curl -fsS "$PRAXIS_FRONTEND_URL" >/dev/null 2>&1; then
  healthy="yes"
fi

echo "running: $running"
echo "healthy: $healthy"
echo "pid: ${frontend_pid:-none}"
echo "url: $PRAXIS_FRONTEND_URL"
echo "pid_file: $PRAXIS_FRONTEND_PID_FILE"
echo "log_file: $PRAXIS_FRONTEND_LOG_FILE"

if [[ "$running" == "yes" && "$healthy" == "yes" ]]; then
  exit 0
fi

exit 1
