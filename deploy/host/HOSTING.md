# ELITZE Agentic Security — Hosting Guide

This folder is a **complete, self-contained production build**. Everything needed to run
the application is inside it. There is no `npm install` step on the host.

```
elitze-host/
├── server.js              Next.js standalone production server (entrypoint)
├── .next/                 Compiled application + static assets
├── public/                Static public files
├── node_modules/          Only the runtime dependencies that are actually used
├── drizzle/               SQL migrations (0001 … )
├── scripts/               Migration runner + self-test scripts
├── .env.example           Every environment variable, documented
├── migrate.sh             Apply database migrations (run first)
├── start.sh               Start the server
├── elitze.service         systemd unit
├── nginx.conf.example     TLS reverse-proxy example
└── Dockerfile.source-build  Container build (from full source repo)
```

## Requirements

| Component  | Version                                                   |
|------------|-----------------------------------------------------------|
| Node.js    | 22.x or newer                                              |
| PostgreSQL | 14 or newer, reachable via `DATABASE_URL`                  |
| Memory     | 1 GB minimum, 2 GB recommended                             |
| Port       | 3000 by default (override with `PORT`)                     |

## 1. Configure

```bash
cp .env.example .env
chmod 600 .env
$EDITOR .env
```

Minimum values required for the app to boot and serve authenticated paths:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.tld
DATABASE_URL=postgresql://user:password@host:5432/elitze
ELITZE_INTERNAL_API_KEY=<64+ random chars>
ELITZE_EVIDENCE_SIGNING_SECRET=<64+ random chars>
ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET=<64+ random chars>
ELITZE_TEAM_BOOTSTRAP_KEY=<64+ random chars>
ELITZE_TEAM_SESSION_SECRET=<64+ random chars>
NODE_ENV=production
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Every other variable (cloud connectors, Okta, GitHub, AWS, Entra, AI gateway, Resend email)
is optional. When a connector's credentials are absent, that connector reports
`BLOCKED` / `UNKNOWN` rather than producing fabricated data — that is intended behaviour.

> `NEXT_PUBLIC_*` values are baked in at **build** time. If you change your public site URL
> or analytics IDs, rebuild from source (`bash deploy/build-release.sh`) rather than only
> editing `.env` on the host.

## 2. Migrate the database

```bash
./migrate.sh
```

Idempotent: it takes a Postgres advisory lock, applies only unapplied files from `drizzle/`,
records them in `_elitze_migrations`, and verifies the required tables exist afterwards.

## 3. Start

Foreground (smoke test):

```bash
./start.sh
# -> ELITZE listening on http://0.0.0.0:3000
```

Verify:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

## 4. Run as a service (systemd)

```bash
sudo mkdir -p /opt/elitze-host
sudo cp -R ./. /opt/elitze-host/
sudo useradd --system --home /opt/elitze-host --shell /usr/sbin/nologin elitze || true
sudo chown -R elitze:elitze /opt/elitze-host
sudo chmod 600 /opt/elitze-host/.env

sudo cp /opt/elitze-host/elitze.service /etc/systemd/system/elitze.service
sudo systemctl daemon-reload
sudo systemctl enable --now elitze
sudo systemctl status elitze
journalctl -u elitze -f
```

## 5. TLS / reverse proxy

Use `nginx.conf.example` (or any proxy) to terminate TLS and forward to `127.0.0.1:3000`.
The app itself already sends HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, and `Permissions-Policy`; do not duplicate or weaken them at the proxy.

Bind the Node process to localhost when a proxy is in front:

```
HOSTNAME_BIND=127.0.0.1
```

in `.env`, then restart.

## Container hosting

If your host prefers containers, build from the **full source repository**:

```bash
docker build -f deploy/Dockerfile -t elitze:latest \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.tld .

docker run -d --name elitze -p 3000:3000 --env-file .env --restart unless-stopped elitze:latest
```

Or with Compose (includes PostgreSQL and a one-shot migration job):

```bash
cd deploy && cp ../.env.example .env && $EDITOR .env
docker compose up -d
```

## Platform-as-a-service hosting

| Platform                   | Settings                                                                      |
|----------------------------|-------------------------------------------------------------------------------|
| Vercel                     | Framework: Next.js. Build `npm run build`. Add env vars. Run migrations separately. |
| Render / Railway / Fly.io  | Use `deploy/Dockerfile`. Health check path `/api/health`. Port 3000.          |
| AWS App Runner / ECS       | Use `deploy/Dockerfile`. Provide env vars from Secrets Manager.               |
| Any VPS                    | Use this folder + `elitze.service`.                                           |

## Upgrading

1. Build a new release folder from source: `bash deploy/build-release.sh`
2. Copy it to the host as `/opt/elitze-host-new`, carry over `.env`.
3. `./migrate.sh` in the new folder.
4. Swap directories and `sudo systemctl restart elitze`.

Migrations are forward-only; take a database snapshot before upgrading.

## Operational checks

```bash
curl -fsS https://your-domain.tld/api/health        # liveness
node scripts/security-self-test.mjs                 # control-path self test
node scripts/verify-evidence.mjs                    # evidence ledger integrity
```

## Security notes

- Never commit or bake `.env` into an image; mount it or use the platform secret manager.
- Keep `ELITZE_GITHUB_MCP_WRITE=false` unless repository mutations are explicitly authorized.
- Rotate `ELITZE_EVIDENCE_SIGNING_SECRET` only with a documented evidence-continuity plan —
  rotation invalidates verification of previously signed records.
- Run the process as a non-root user; the provided systemd unit already does.
