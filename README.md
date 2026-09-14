# ELITZE Agentic Security

**Policy enforcement at the point of generation, not after the fact.**

ELITZE Agentic Security is a governed security control plane for AI agents, MCP, LLM applications, APIs, software, cloud, identity, data and runtime behavior. It connects security graph context, policy enforcement, continuous validation and evidence so security decisions can be traced from signal to verified outcome.

## Security surface

- AI and agentic security: AI Security Gateway, agent boundaries, MCP and tool governance.
- Application and API security: API security, OpenAPI governance, code and supply-chain controls.
- Cloud, identity and data security: connected posture, authorization, sensitive-data pathways and runtime context.
- Exposure and vulnerability operations: attack paths, CVE intelligence, remediation priority and verification.
- Security operations: investigation, governed response, containment, audit and evidence.
- **ELITZE Global Security View:** an interactive visual command surface for navigating connected security domains, exposure relationships and authorized visual intelligence.
- **REO:** continuous validation of reachable and exploitable conditions with evidence-backed retesting.
- **ROI:** evidence-backed business value measurement connecting security outcomes to approved financial assumptions.

## Product standard

ELITZE is built around a continuous **Detect → Explain → Authorize → Act → Retest → Evidence** loop. It distinguishes observed evidence from inferred or unavailable state and does not manufacture live telemetry, assets, alerts, remediation outcomes or financial savings.

See [`docs/ELITZE-CATEGORY-LEADER-MANIFEST.md`](docs/ELITZE-CATEGORY-LEADER-MANIFEST.md) for the acceptance standard, [`docs/ELITZE-ROI.md`](docs/ELITZE-ROI.md) for the ROI model, and [`src/app/compare/page.tsx`](src/app/compare/page.tsx) for the product-facing benchmark.

## ROI model

The executive ROI surface is available at `/console/roi`. ELITZE separates persisted security observations from customer-approved financial assumptions.

**Annual benefit = incident cost avoided + engineering value recovered + AI/cloud spend avoided + audit/evidence cost avoided.**

**Net benefit = annual benefit − annual ELITZE cost.**

**ROI = net benefit ÷ annual ELITZE cost.**

When required observations or financial assumptions are unavailable, ELITZE shows `UNMEASURABLE` rather than fabricating a savings figure.

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
- `GET /api/roi` — observed ELITZE security-value signals for the executive ROI surface.
- `POST /api/security/decision` — authenticated policy decision and persistence.
- `POST /api/security/kill-switch` — authenticated containment request and optional executor dispatch.
- `GET /api/market` — database-backed security state.
- `GET /api/data-hub` — database-backed data-source and insight state.
- `GET /api/use-cases` — database-backed use-case state.
- `GET /api/crm` — authenticated CRM state.

## Secrets

Real secrets must be supplied through the deployment environment or secret manager. Never commit `.env`, `.env.local`, API keys, credentials, or production database URLs.
