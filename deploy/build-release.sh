#!/usr/bin/env bash
# ELITZE Agentic Security — build a single self-contained hostable folder.
#
#   bash deploy/build-release.sh
#
# Output:
#   deploy/release/elitze-host/            <- copy this whole folder to the host
#   deploy/release/elitze-host.tar.gz      <- same folder, packaged
#
# On the host:  cd elitze-host && ./start.sh      (Node 22+, nothing else required)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/deploy/release/elitze-host"

cd "$ROOT"

echo "==> Installing dependencies"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

echo "==> Building production bundle (next build, output: standalone)"
NEXT_TELEMETRY_DISABLED=1 npm run build

echo "==> Assembling $OUT"
rm -rf "$ROOT/deploy/release"
mkdir -p "$OUT"

# 1. Next.js standalone server + its minimal node_modules
cp -R .next/standalone/. "$OUT"/
mkdir -p "$OUT/.next"
cp -R .next/static "$OUT/.next/static"
cp -R public "$OUT/public"

# 2. Database migrations and the migration runner
cp -R drizzle "$OUT/drizzle"
mkdir -p "$OUT/scripts"
cp scripts/*.mjs "$OUT/scripts"/

# 3. Postgres driver for the migration runner (standalone tracing may omit it)
mkdir -p "$OUT/node_modules"
for pkg in pg pg-pool pg-protocol pg-types pg-int8 pg-connection-string pg-cloudflare \
           postgres-array postgres-bytea postgres-date postgres-interval \
           pg-numeric pgpass split2 obuf dotenv; do
  if [ -d "node_modules/$pkg" ] && [ ! -d "$OUT/node_modules/$pkg" ]; then
    cp -R "node_modules/$pkg" "$OUT/node_modules/$pkg"
  fi
done

# 4. Operator files
cp .env.example "$OUT/.env.example"
cp deploy/host/start.sh "$OUT/start.sh"
cp deploy/host/migrate.sh "$OUT/migrate.sh"
cp deploy/host/elitze.service "$OUT/elitze.service"
cp deploy/host/nginx.conf.example "$OUT/nginx.conf.example"
cp deploy/host/HOSTING.md "$OUT/HOSTING.md"
cp deploy/Dockerfile "$OUT/Dockerfile.source-build"
chmod +x "$OUT/start.sh" "$OUT/migrate.sh"

# 5. Reference documentation shipped with the release
mkdir -p "$OUT/docs"
cp README.md SECURITY.md "$OUT/docs"/ 2>/dev/null || true

echo "==> Packaging tarball"
( cd "$ROOT/deploy/release" && tar -czf elitze-host.tar.gz elitze-host )

echo
echo "Done."
du -sh "$OUT" "$ROOT/deploy/release/elitze-host.tar.gz"
echo
echo "Ship: deploy/release/elitze-host/  (or elitze-host.tar.gz)"
echo "Run on host: cp .env.example .env && edit it && ./migrate.sh && ./start.sh"
