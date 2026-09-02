# Security operations

ELITZE · Agentic Security is an authorized defensive platform. Offensive validation must run only against explicitly authorized targets.

## Security-critical configuration

Required in protected environments:

- `DATABASE_URL` — PostgreSQL connection string.
- `ELITZE_INTERNAL_API_KEY` — secret used for internal security-control endpoints. Store it in the deployment secret manager; never commit it.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run db:migrate
```

## Decision endpoint

`POST /api/security/decision` requires `x-elitze-api-key` and evaluates an action against identity, purpose binding, restricted-data, privilege, and high-impact/HITL gates. Every accepted evaluation is persisted to `security_decisions` before the response is returned.

## Kill-switch endpoint

`POST /api/security/kill-switch` requires the same internal authorization and records a containment request. Actual isolation, credential revocation, or workload termination must be performed by a deployment-specific executor; the API does not pretend to have infrastructure powers it does not possess.

## Integrity rule

Never place fabricated counts, percentages, CVE totals, detections, latency claims, or “live” security status in the UI. Operational metrics must come from a real source and identify their source/time window.
