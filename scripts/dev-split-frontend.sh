#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:4001}"
export PRAXIS_API_BASE_URL="${PRAXIS_API_BASE_URL:-http://127.0.0.1:4001}"

PORT="${1:-3002}"

exec npx next dev --port "$PORT"
