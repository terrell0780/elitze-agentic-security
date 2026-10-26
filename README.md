# ELITZE Agentic Security

**Identity-aware security for AI agents, MCP servers, tools, and sensitive execution paths.**

> The model is not the security boundary.

ELITZE Agentic Security is the product identity across the application, documentation, and supported security workflows. Its design connects agent identity, tenant boundaries, policy decisions, controlled execution, runtime observation, and auditable evidence. A documented capability is not proof of a live integration or verified production outcome.

**ELITZE website:** [elitze.info](https://www.elitze.info) · **Source repository:** [elitze-agentic-security](https://github.com/terrell0780/elitze-agentic-security)

## What ELITZE is built to do

- **Govern agent identity and access** across AI agents, MCP servers, tools, and sensitive execution paths.
- **Evaluate policy before action** with a defined decision and authorization flow.
- **Map execution reach** across identities, tools, integrations, and tenant boundaries.
- **Coordinate controlled execution** through scoped runner and integration patterns.
- **Observe and retest** security-relevant behavior as part of a repeatable control loop.
- **Preserve decision evidence** for review, investigation, and operational accountability.
- **Support security workflows** through authenticated workspaces, a security console, data-bridge adapters, and integration health endpoints. Live connectivity and operational status must be verified separately.

## User, business, and owner workflows

- **Personal/initial sign-up:** creates a new tenant and assigns the creator the tenant-owner role; role selection is not accepted from client input.
- **Business owner:** can edit the tenant's business name and slug, see tenant members, invite teammates, choose least-privilege roles, and revoke pending invitations.
- **Security admin:** can manage security and integrations and invite non-admin members; only the owner can grant admin access or change the business profile.
- **Analyst/member:** can work with security data under the tenant permission model.
- **Approver:** can review governed actions; **viewer:** is read-only.
- **Invitations:** are sent by configured transactional email, stored as token hashes, single-use, tenant-scoped, rate-limited, and expire after seven days. An email already linked to an account cannot yet join a second tenant; multi-organization membership is a documented limitation.
- **Security-tool evidence:** Nmap XML, John the Ripper summary results, and Aircrack-ng Wi-Fi survey CSV are imported through authenticated, bounded endpoints. Metasploit integration is read-only through an operator-managed HTTPS bridge; the web application does not directly execute exploit modules or wireless attacks.

Role/access checks and integration parser tests run as part of the production build gates. A successful build validates the code path; live email, database migrations, and tool bridges must still be configured to use the corresponding features.

## The ELITZE control loop

```text
Discover
   ↓
Identify
   ↓
Map Reach
   ↓
Evaluate Policy
   ↓
Decide
   ↓
Authorize Execution
   ↓
Observe
   ↓
Retest
   ↓
Prove
```

The workflow links what an agent can reach to who or what is acting, which policy applies, what decision was made, and what evidence is available afterward.

## Architecture

- **ELITZE Control Plane** — coordinates identity-aware security workflows and governed orchestration.
- **SARA Supervisory Layer** — provides supervisory assurance within the control plane's identity, policy, approval, and evidence boundaries.
- **Policy and Execution Controls** — evaluates decisions and governs scoped runner execution.
- **Security Workspace** — provides authenticated workspace and console entry points for security operations.
- **Data Bridge** — organizes source ingestion, observed signals, adapter capabilities, and integration health.
- **Evidence and Audit** — supports attributable security decisions and reviewable operational records.
- **Persistence** — uses PostgreSQL-backed application state and documented database migrations.

## Application surface

| Route | Purpose |
| --- | --- |
| `/login` and `/register` | Account access |
| `/workspace` and `/console` | Authenticated workspace and security console |
| `GET /api/health` | Service health |
| `POST /api/security/decision` | Policy decision workflow |
| `POST /api/data-bridge/ingest` | Source ingestion |
| `GET /api/data-bridge/observe` | Security signal observation |
| `GET /api/data-bridge/health` | Data Bridge health |
| `GET /api/data-bridge/adapters` | Connector capability manifest |
| `POST /api/elitze` | Governed orchestration planning |

## Technology

- Next.js and React application
- TypeScript
- Node.js 24+
- PostgreSQL with Drizzle ORM
- npm lockfile for reproducible dependency installation
- Dedicated scripts for security, authentication, tenant, policy, runner, data-bridge, and configuration checks

## Run locally

### Requirements

- Node.js 24 or newer
- npm 10 or newer

### Setup

```bash
git clone https://github.com/terrell0780/elitze-agentic-security.git
cd elitze-agentic-security
npm ci
npm run dev
```

The development server starts the Next.js application. Configure the environment variables required by the selected workflows using [`.env.example`](.env.example).

### Engineering checks

Run the checks relevant to your change:

```bash
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

## Security model

ELITZE is organized around identity, tenant isolation, explicit policy, scoped execution, and attributable evidence.

- Derive actor and tenant identity from the authenticated server-side session.
- Apply authorization and scope checks before consequential actions.
- Keep integrations within explicitly configured and authorized connections.
- Protect credentials in environment configuration or a deployment secret manager.
- Preserve security-relevant decisions and execution records for review.
- Use retesting to connect remediation work with follow-up evidence.

## Documentation

- [Security reporting](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)
- [Architecture and deployment manifest](docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md)
- [Production integrations](docs/ELITZE-PRODUCTION-INTEGRATIONS.md)
- [Enterprise security controls](docs/ENTERPRISE-SECURITY-CONTROL-STATUS.md)
- [Third-party license inventory](docs/security/THIRD-PARTY-LICENSE-INVENTORY-2026-10-11.md)

## Contributing

Focused contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), keep changes scoped, add relevant tests, and preserve the project's identity, tenant, authorization, and audit boundaries.

---

**ELITZE Agentic Security** — control the path from agent intent to authorized action.
