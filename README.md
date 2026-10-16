# ELITZE Agentic Security

**Agent Identity and MCP Runtime Security**

**Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.**

**Transaction model:** outright software/IP acquisition. The seller is not offering an ongoing SaaS subscription, managed hosting, billing, customer support, renewals, or customer-success operation. Buyer-owned operating responsibilities begin after transfer.

ELITZE is narrowing its initial commercial proof to a real, evidence-backed control path for agent identity, MCP servers, tools, reachability, policy enforcement, authorized execution, runtime observation, retesting, and tamper-evident evidence.

## Frontier enterprise security vision

ELITZE is being built toward a unified enterprise security control plane spanning AI, identity, endpoint, cloud, network, application/API, data, SaaS/email, threat intelligence, SecOps, governance, and evidence. The long-term target is to compete for the security workloads addressed by major enterprise security platforms while keeping ELITZE's production-truth rules: no fake telemetry, no unsupported claims, and no capability marked operational without real verification.

See [`docs/ELITZE-FRONTIER-ENTERPRISE-SECURITY-VISION.md`](docs/ELITZE-FRONTIER-ENTERPRISE-SECURITY-VISION.md) for the full capability and execution standard.

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

## Initial production integration wave

ELITZE now has provider-specific adapter paths for five initial ecosystems:

1. **MCP Gateway / Server** — discover MCP servers/tools and perform authenticated server discovery using the 2026-07-28 protocol path.
2. **GitHub + GitHub Actions** — observe repositories and workflow runs for source/release identity and evidence.
3. **AWS IAM + CloudTrail** — observe authenticated CloudTrail activity for AWS identity and runtime evidence.
4. **Microsoft Entra ID + Azure** — observe Microsoft Graph directory context for identity and authorization evidence.
5. **Kubernetes** — observe authenticated Kubernetes API/RBAC context for workload identity and runtime reachability.

These adapters participate in the ELITZE control-plane path rather than functioning as passive data imports. See [`docs/ELITZE-PRODUCTION-INTEGRATIONS.md`](docs/ELITZE-PRODUCTION-INTEGRATIONS.md).

**Important:** adapter code is not the same thing as a live customer integration. A connector is `INTEGRATED` only after real credentials/configuration and a live authenticated provider path have been verified. Without those conditions, its runtime state remains `BLOCKED`, `UNKNOWN`, or `UNMEASURABLE` as appropriate.

**MCP execution safety default:** `.env.example` keeps `ELITZE_MCP_GATEWAY_ENABLED=false` and `ELITZE_MCP_GATEWAY_EXECUTION_ENABLED=false`. Operators must explicitly enable a controlled staging path only after setting an exact upstream host allowlist and the required server-side credentials. Tool execution remains off until the authorized execution test is approved.

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

Google Search requires helpful, reliable, people-first content and prohibits spam practices including scaled low-value generated content. Google Ads policies prohibit misleading representation, unreliable claims, unclear relevance, and unavailable offers. Google Search guidance for AI features likewise relies on normal Search eligibility and people-first quality requirements. 

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
- `GET /api/data-bridge/adapters` — internal authenticated connector capability manifest.

## Secrets

Real secrets must be supplied through the deployment environment or secret manager. Never commit `.env`, database URLs, API keys, credentials, or generated secret material.

See [`docs/ELITZE-CATEGORY-LEADER-MANIFEST.md`](docs/ELITZE-CATEGORY-LEADER-MANIFEST.md) and [`docs/ELITZE-PRODUCTION-INTEGRATIONS.md`](docs/ELITZE-PRODUCTION-INTEGRATIONS.md).
