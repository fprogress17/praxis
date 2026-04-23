#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/stop-frontend.sh" >/dev/null 2>&1 || true
bash "$ROOT_DIR/scripts/stop-backend.sh" >/dev/null 2>&1 || true

echo "Praxis desktop runtime stopped."
