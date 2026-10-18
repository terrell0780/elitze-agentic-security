# ELITZE Agentic Security

**Enterprise cybersecurity workspace for agent identities, MCP execution, policy enforcement, vulnerability validation, and evidence-backed security operations.**

The model is not the security boundary. ELITZE binds agent and workload identity, tenant context, authorization, controlled execution, observation, retesting, and audit evidence into one security control plane.

ELITZE is built to compete for the security workloads handled by leading enterprise cybersecurity platforms. That is a product direction, not a claim of independent ranking, certification, or full parity. Capabilities are reported as operational only when the corresponding connected control path and evidence have been verified.

## Unified architecture

- **ELITZE runtime orchestrator** — executive routing and governed task planning.
- **SARA** — assistant and supervisory assurance layer operating inside ELITZE identity, policy, approval, and evidence controls.
- **Sentinel security layer** — integrated protection within ELITZE Agentic Security, not a separate product.
- **Private workspace** — authenticated console for tenant-scoped security operations, agent identity, policy decisions, validation, and evidence review.
- **Security runner** — separate, scope-constrained execution tier for authorized checks and signed control-plane handshakes.
- **Security data plane** — PostgreSQL persistence, tenant controls, Data Bridge, adapter registry, evidence ledger, and workflow state.

## Core control loop

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove`

A task plan is not proof of execution. A connector implementation is not proof of a live provider connection. A passing self-test is not a substitute for a real production handshake, an authorized scan, or tenant-scoped evidence.

## Workspace

- `/workspace` — authenticated entry to the workspace.
- `/console` — protected security console.
- `/login` and `/register` — identity entry points.

Workspace and security API routes must derive actor and tenant identity from an authenticated server session, not from client-supplied tenant IDs. High-impact actions require the applicable policy and approval boundaries.

## Security capabilities

The codebase provides the foundations for agent/MCP discovery, reachability mapping, deterministic policy decisions, security graph analysis, vulnerability intelligence, authorized validation requests, runner callbacks, tenant-scoped workflows, audit evidence, RAG/vector retrieval, and controlled external data ingestion.

Integration state must distinguish **implemented**, **configured**, **connected**, and **verified**. No fake telemetry, synthetic incidents, invented customers, fabricated results, unsupported rankings, or unverified integrations may be presented as production truth. Unknown evidence remains `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`.

See:
- [Unified architecture manifest](docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md)
- [Production integrations](docs/ELITZE-PRODUCTION-INTEGRATIONS.md)
- [Enterprise security vision](docs/ELITZE-FRONTIER-ENTERPRISE-SECURITY-VISION.md)
- [Enterprise security control status](docs/ENTERPRISE-SECURITY-CONTROL-STATUS.md)
- [Third-party license inventory](docs/security/THIRD-PARTY-LICENSE-INVENTORY-2026-10-11.md)
- [SBOM](docs/security/ELITZE-SBOM-2026-10-11.cdx.json)

## Development and release validation

Use the repository's lockfile and Node version declared by the Vercel project.

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
```

Before production deployment:
1. Provide production database and authentication secrets through the deployment secret manager.
2. Apply the SQL migrations with `npm run db:production-migrate` using the explicitly approved production database.
3. Verify authentication, tenant isolation, recovery/session controls, migration state, and internal health diagnostics.
4. Verify each external connector with real authorized credentials and source-attributed records.
5. Verify the runner public health endpoint and signed handshake; separately authorize and verify any actual scan.
6. Promote only a build whose required release gates have passed.

The deployment must not invent data or seed synthetic security records. An absent or disconnected source stays explicitly unknown.

## Useful endpoints

- `GET /api/health` — minimal health response.
- `GET /api/console/health` — authenticated operational checks.
- `GET /api/security/skills` — governed ELITZE security skills.
- `POST /api/security/decision` — authenticated policy evaluation and persistence.
- `POST /api/data-bridge/ingest` — authenticated source ingestion.
- `GET /api/data-bridge/observe` — normalized observed security signals.
- `GET /api/data-bridge/health` — tenant-authorized bridge health.
- `GET /api/data-bridge/adapters` — authenticated connector capability manifest.
- `POST /api/elitze` — authenticated ELITZE orchestration planning.

## Secrets and tenant boundary

Supply real secrets through environment configuration or the secret manager. Never commit deployment tokens, private keys, database URLs, API credentials, customer information, or secret material. Tenant-scoped APIs must enforce authorization server-side and return no sensitive diagnostics to anonymous callers.

## Product truth

ELITZE prioritizes verified controls over impressive-looking dashboards. Do not claim independent ranking, certification, customer outcomes, security coverage percentages, or live integration status without current, independently reviewable evidence. Distinguish the platform's implemented code from capabilities whose providers or production execution remain unconnected.
