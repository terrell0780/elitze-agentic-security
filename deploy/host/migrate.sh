#!/usr/bin/env bash
# ELITZE Agentic Security — apply database migrations. Run once per deploy,
# BEFORE start.sh. Safe to re-run: applied migrations are skipped.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set (put it in .env)." >&2
  exit 1
fi

echo "Applying ELITZE migrations..."
node scripts/migrate.mjs
echo "Migrations complete."
