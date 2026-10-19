# ELITZE Agentic Security

**Identity-aware security controls for AI agents, MCP servers, tools, and sensitive execution paths.**

> The model is not the security boundary.

ELITZE Agentic Security brings identity, tenant isolation, policy evaluation, authorized execution, observation, retesting, and audit evidence into one control plane. The product's canonical site is [elitze.info](https://www.elitze.info).

## Security control loop

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove`

Every action must be tied to an authenticated actor, tenant boundary, policy decision, authorized scope, and attributable evidence. A planned action is not proof of execution; code for an integration is not proof that the provider is connected.

## Architecture

- **ELITZE** — core control plane and governed orchestration.
- **SARA** — supervisory assurance layer operating within ELITZE's identity, policy, approval, and evidence boundaries.
- **Security enforcement** — gateway, deterministic policy decisions, scoped runner, and audit ledger.
- **Private workspace** — authenticated tenant-scoped security workflows and evidence review.
- **Data plane** — PostgreSQL-backed state, Data Bridge, adapters, workflow state, and audit evidence.

See the [architecture and deployment manifest](docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md) for component boundaries and deployment requirements.

## Application routes

- `/login` and `/register` — account entry points.
- `/workspace` and `/console` — authenticated workspace and security console.
- `GET /api/health` — minimal service health.
- `POST /api/security/decision` — policy evaluation.
- `POST /api/data-bridge/ingest` — authenticated source ingestion.
- `GET /api/data-bridge/observe` — observed security signals.
- `GET /api/data-bridge/health` — authorized Data Bridge health.
- `GET /api/data-bridge/adapters` — connector capability manifest.
- `POST /api/elitze` — governed orchestration planning.

Protected routes must derive actor and tenant identity from the server-authenticated session. Do not trust client-supplied tenant identifiers.

## Local development

Requirements: the Node.js version configured for the deployment (currently Node.js 24) and npm.

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run workspace-platform:self-test
npm run platform:readiness
npm run production-config:self-test
npm run runner:self-test
npm run runner:handshake-self-test
npm run runner:control-plane-handshake-self-test
npm run build
npm run start
```

Use `npm run dev` for local development. Keep `package-lock.json` in sync with `package.json`; use `npm ci` for reproducible installs.

## Configuration and deployment

1. Copy only the required variables from [`.env.example`](.env.example) into your local environment or deployment secret manager.
2. Never commit real credentials, private keys, database URLs, customer data, or deployment tokens.
3. Apply migrations only to the explicitly approved database using the documented production migration procedure.
4. Verify authentication, tenant isolation, session/recovery controls, migration state, and the runner's signed handshake before release.
5. Verify external integrations using authorized credentials and source-attributed records. A self-test alone is not live-provider proof.
6. Deploy only a commit that passes the required CI and release gates.

## Evidence and security claims

Integration state must distinguish **implemented**, **configured**, **connected**, and **verified**. Do not add fabricated telemetry, synthetic incidents, invented customers, unsupported certifications, rankings, coverage percentages, or unverified provider status. Missing evidence must remain `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`.

Read [SECURITY.md](SECURITY.md) for vulnerability reporting. See [production integrations](docs/ELITZE-PRODUCTION-INTEGRATIONS.md), [enterprise security control status](docs/ENTERPRISE-SECURITY-CONTROL-STATUS.md), and the [third-party license inventory](docs/security/THIRD-PARTY-LICENSE-INVENTORY-2026-10-11.md) for additional project documentation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes focused, preserve tenant and identity boundaries, add or update tests, and document evidence for security-relevant behavior.
