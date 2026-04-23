#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/praxis-backend-env.sh"

backend_pid=""
if [[ -f "$PRAXIS_BACKEND_PID_FILE" ]]; then
  backend_pid="$(cat "$PRAXIS_BACKEND_PID_FILE")"
fi

running="no"
if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
  running="yes"
fi

healthy="no"
if curl -fsS "$PRAXIS_BACKEND_URL/health" >/dev/null 2>&1; then
  healthy="yes"
fi

echo "running: $running"
echo "healthy: $healthy"
echo "pid: ${backend_pid:-none}"
echo "url: $PRAXIS_BACKEND_URL"
echo "pid_file: $PRAXIS_BACKEND_PID_FILE"
echo "log_file: $PRAXIS_BACKEND_LOG_FILE"

if [[ "$running" == "yes" && "$healthy" == "yes" ]]; then
  exit 0
fi

exit 1
