# ELITZE Agentic Security

**Agent Identity and MCP Runtime Security**

**Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.**

ELITZE is narrowing its initial commercial proof to a real, evidence-backed control path for agent identity, MCP servers, tools, reachability, policy enforcement, authorized execution, runtime observation, retesting, and tamper-evident evidence.

## Initial control loop

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove`

The system is not complete because a dashboard state changes. The underlying tenant-scoped records, authorization decision, execution result, retest result, and evidence must exist in the connected control path.

## Production truth

ELITZE production mode uses **real connected records only**.

- No mock data.
- No fake telemetry.
- No synthetic operational metrics.
- No simulated security events presented as real.
- No counterfactual/copy-of-graph simulation represented as an operational security control.
- No placeholder success states.
- No invented customers, agents, assets, findings, reachability, remediation, savings, rankings, or integrations.
- Missing or unavailable evidence remains `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH` as appropriate.

## Initial security surface

- Agent discovery and inventory.
- MCP server and tool inventory.
- Workload / non-human identity.
- Identity-to-capability and reachability mapping.
- Secrets and sensitive-data reachability.
- Policy enforcement before sensitive tool execution.
- Approval boundaries for high-impact actions.
- Separately authorized gateway execution.
- Tamper-evident decision evidence.
- Observed runtime outcomes.
- Retesting and evidence-backed closure.

Broader security domains may exist in the architecture, but they are not claimed as simultaneously proven product scope unless the relevant live control path is implemented, connected, and verified.

## REO / RIO / ROE

**REO** is evidence-backed retesting of a real reachable/exploitable condition and proof of the resulting security state.

**RIO** separates observed security outcomes from customer-approved financial assumptions. No financial result is invented when the required inputs are unavailable.

**ROE** governs authorized validation activity, scope, approvals, evidence, and release/runtime testing boundaries.

These are evidence controls, not marketing labels.

## Google 2026 publishing standard

ELITZE public content and advertising must describe what is actually available at the destination. We do not claim Google endorsement, partnership, preferred placement, guaranteed ranking, guaranteed traffic, guaranteed conversion, or special Google access without a real authorized relationship. We do not publish fabricated reviews, customer counts, rankings, performance statistics, or trust signals.

Search and advertising compliance is maintained in [`docs/GOOGLE-2026-PUBLISHING-COMPLIANCE.md`](docs/GOOGLE-2026-PUBLISHING-COMPLIANCE.md), which tracks the applicable official Google Search and Google Ads guidance used for ELITZE publishing.

## Data Bridge

The ELITZE Data Bridge is the controlled path for authorized external security data entering the ELITZE control plane:

`External source → source authentication → tenant binding → validation → normalization → idempotent persistence → audit evidence → ObservedSignal`

The bridge remains vendor-neutral and supports reviewed transports including `WEBHOOK`, `REST_PULL`, `EVENT_STREAM`, `MCP`, and `CUSTOM`.

## Security boundary

The model or agent is not the security boundary. Identity, policy, authorization, execution controls, evidence, and verified runtime outcomes form the security boundary.

## Production path

1. Provide `DATABASE_URL` and required internal authentication secrets through the deployment environment.
2. Run the database migrations against the production database.
3. Verify the connected tenant and identity path.
4. Run typecheck, lint, tests, Data Bridge self-test, build, and sale-readiness checks.
5. Deploy the application with the same database and secret configuration.

The repository does not seed synthetic records on startup. Empty or disconnected production state remains empty or explicitly unavailable.

## Core endpoints

- `GET /api/health` — database readiness.
- `GET /api/security/skills` — governed ELITZE security skills.
- `POST /api/security/decision` — authenticated policy evaluation and persistence.
- `POST /api/data-bridge/ingest` — authenticated security-event ingestion.
- `GET /api/data-bridge/observe` — normalized observed security signals.
- `GET /api/data-bridge/health` — bridge health for an authorized tenant.

## Secrets

Real secrets must be supplied through the deployment environment or secret manager. Never commit `.env`, database URLs, API keys, credentials, or generated secret material.

See [`docs/ELITZE-CATEGORY-LEADER-MANIFEST.md`](docs/ELITZE-CATEGORY-LEADER-MANIFEST.md) and [`docs/ELITZE-AGENT-IDENTITY-MCP-RUNTIME-CONTRACT.md`](docs/ELITZE-AGENT-IDENTITY-MCP-RUNTIME-CONTRACT.md) for the acceptance standards.
