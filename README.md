# ELITZE · Agentic Security

ELITZE is a security control plane for identities, agents, tools, data access and runtime containment.

## Production path

1. Copy `.env.example` to a secret-managed environment.
2. Set `DATABASE_URL` and `ELITZE_INTERNAL_API_KEY`.
3. Run `npm install`.
4. Run `npm run db:migrate` against the production database.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
6. Deploy the application with the same runtime environment and database.

The repository does not seed synthetic records on startup. Empty database state is surfaced as empty state in the console.

## Security boundary

The model or agent is not the security boundary. Internal security-decision and containment APIs require the ELITZE internal API key. Containment also requires a separately configured infrastructure executor; without one, ELITZE records the request and fails closed rather than claiming that infrastructure was isolated.

## Core endpoints

- `GET /api/health` — database readiness check.
- `GET /api/search?q=...` — server-side public search broker with bounded input and untrusted-result labeling.
- `POST /api/security/decision` — authenticated policy decision and persistence.
- `POST /api/security/kill-switch` — authenticated containment request and optional executor dispatch.
- `GET /api/market` — database-backed security state.
- `GET /api/data-hub` — database-backed data-source and insight state.
- `GET /api/use-cases` — database-backed use-case state.
- `GET /api/crm` — authenticated CRM state.

## Secrets

Real secrets must be supplied through the deployment environment or secret manager. Never commit `.env`, `.env.local`, API keys, credentials, or production database URLs.
