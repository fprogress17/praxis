#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

backend_ok=0
frontend_ok=0

bash "$ROOT_DIR/scripts/backend-status.sh" || backend_ok=$?
bash "$ROOT_DIR/scripts/frontend-status.sh" || frontend_ok=$?

if [[ "$backend_ok" -eq 0 && "$frontend_ok" -eq 0 ]]; then
  exit 0
fi

exit 1
