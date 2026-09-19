# ELITZE — Deployment folder

Everything needed to host ELITZE Agentic Security lives here.

## The hostable folder

```bash
bash deploy/build-release.sh
```

Produces:

- `deploy/release/elitze-host/` — **the folder to hand to whoever hosts it.** Self-contained:
  compiled app, static assets, runtime `node_modules`, SQL migrations, `.env.example`,
  `migrate.sh`, `start.sh`, systemd unit, nginx example, and `HOSTING.md`.
- `deploy/release/elitze-host.tar.gz` — the same folder, packaged for transfer (~24 MB).

On the host (Node.js 22+ and PostgreSQL 14+ are the only prerequisites):

```bash
tar -xzf elitze-host.tar.gz && cd elitze-host
cp .env.example .env && chmod 600 .env && $EDITOR .env
./migrate.sh
./start.sh
```

Full instructions: `deploy/host/HOSTING.md` (also copied into the release folder).

## Files

| File | Purpose |
|------|---------|
| `build-release.sh` | Builds the self-contained `elitze-host` folder + tarball. |
| `Dockerfile` | Multi-stage production container (build from repo root). |
| `docker-compose.yml` | App + PostgreSQL + one-shot migration job. |
| `.dockerignore` | Reference ignore list for container builds. |
| `host/HOSTING.md` | Operator hosting guide (requirements, env, systemd, TLS, upgrades). |
| `host/start.sh` | Loads `.env`, binds `0.0.0.0:3000`, runs `node server.js`. |
| `host/migrate.sh` | Idempotent database migration runner. |
| `host/elitze.service` | Hardened systemd unit. |
| `host/nginx.conf.example` | TLS reverse-proxy config. |

## Container quick start

```bash
docker build -f deploy/Dockerfile -t elitze:latest \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.tld .
docker run -d -p 3000:3000 --env-file .env --restart unless-stopped elitze:latest
```

## Notes

- `deploy/release/` is git-ignored — it is a build output, regenerate it any time.
- `NEXT_PUBLIC_*` variables are compiled in at build time; changing them requires a rebuild.
- Health endpoint: `GET /api/health` (returns 503 until `DATABASE_URL` is reachable).
