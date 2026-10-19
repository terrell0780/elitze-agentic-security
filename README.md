# ELITZE Agentic Security

**Identity-aware security for AI agents, MCP servers, tools, and sensitive execution paths.**

> The model is not the security boundary.

ELITZE Agentic Security is a security control plane designed to connect agent identity, tenant boundaries, policy decisions, controlled execution, runtime observation, and auditable evidence. It is built around a simple principle: every consequential action should have a clear identity, an explicit authorization path, and a traceable decision.

**Product:** [elitze.info](https://www.elitze.info) · **Repository:** [Source code](https://github.com/terrell0780/elitze-agentic-security)

## What ELITZE is built to do

- **Govern agent identity and access** across AI agents, MCP servers, tools, and sensitive execution paths.
- **Evaluate policy before action** with a defined decision and authorization flow.
- **Map execution reach** across identities, tools, integrations, and tenant boundaries.
- **Coordinate controlled execution** through scoped runner and integration patterns.
- **Observe and retest** security-relevant behavior as part of a repeatable control loop.
- **Preserve decision evidence** for review, investigation, and operational accountability.
- **Support enterprise security workflows** through authenticated workspaces, a security console, data-bridge adapters, and integration health endpoints.

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
