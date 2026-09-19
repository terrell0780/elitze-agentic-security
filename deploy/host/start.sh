#!/usr/bin/env bash
# ELITZE Agentic Security — start the production server on this host.
# Requires: Node.js 22+ . No npm install needed; dependencies are bundled.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "WARNING: no .env found. Copy .env.example to .env and fill it in." >&2
fi

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export HOSTNAME="${HOSTNAME_BIND:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "ELITZE listening on http://${HOSTNAME}:${PORT}"
exec node server.js
