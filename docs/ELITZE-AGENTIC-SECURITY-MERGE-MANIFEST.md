# ELITZE Agentic Security — Architecture and Deployment Manifest

**Canonical repository:** [`terrell0780/elitze-agentic-security`](https://github.com/terrell0780/elitze-agentic-security)  
**Canonical product:** ELITZE Agentic Security  
**Production web domain:** [`https://www.elitze.info`](https://www.elitze.info) (the apex domain `https://elitze.info` redirects to www)

This document defines the intended architecture and deployment boundaries. It is not, by itself, proof that a production integration is connected or a service is healthy. Use runtime checks and source-attributed evidence for operational claims.

## System boundaries

- **ELITZE control plane:** The core orchestration and policy boundary. The runtime orchestrator is `src/lib/elitze-secure/elitze-agent.ts`; `POST /api/elitze` is the governed planning/API entry point.
- **SARA supervisory layer:** Provides operator-facing assistance and supervisory assurance within ELITZE's authenticated identity, tenant, policy, approval, and evidence controls. SARA does not create independent execution authority.
- **Security enforcement:** Gateway checks, deterministic policy decisions, enforcement points, the audit ledger, configured adapters, and the scoped runner form the security-protection layer within the same product.
- **Persistent workflows:** `src/lib/elitze-secure/agent-workflow.ts` and the related database migrations persist tenant-scoped workflow state, identity checks, approval gates, delegation limits, provenance, and evidence/retest state. A stored schedule is not proof that a production scheduler is running.
- **Agentic SOC analysis:** The tenant-authenticated LangGraph path analyzes eligible tenant-scoped observed events. Model review must not invent findings or silently change source severity.
- **Security runner:** The `runner/` directory contains the separately deployed execution tier. It must validate signed requests, explicit authorization and scope, target allowlists, safety limits, timeouts, and signed callbacks. It is subordinate to the ELITZE control plane.
- **Frontend and data plane:** The Next.js App Router application and tenant-scoped database provide the shared workspace, API routes, identity and policy state, Data Bridge, adapters, workflows, and evidence.

## Code and deployment boundaries

- `src/lib/elitze-secure/elitze-agent.ts` is the product runtime orchestrator; do not confuse it with a CI helper.
- `generated/elitze_orchestrator.py` is a bounded CI self-test/evidence wrapper for the allowlisted runner handshake. It is not the product runtime orchestrator.
- `src/app/api/elitze/route.ts` plans and records governed work. A returned plan is not proof that an external action executed.
- `ElitzeActionExecutor` is an execution interface. External execution requires a real authorized executor or adapter and applicable policy approval.
- A production runner must use the canonical repository and `runner/Dockerfile`, share the approved HMAC secret through secret managers, and pass its health and signed-handshake checks. A runner sourced from another repository is not the canonical runner.

## Security workflow

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove`

Each execution path must bind the authenticated actor, tenant, workload/agent identity, requested scope, policy result, approval decision, execution outcome, and evidence. Tenant boundaries are enforced server-side; client-provided tenant identifiers are not authorization.

## Security foundations

The repository includes implementation foundations for typed security decisions, policy enforcement, tamper-evident audit records, security graph analysis, agent risk evaluation, content-integrity decisions, generation/runtime enforcement, and CVE/KEV/EPSS prioritization. Their presence in source code does not establish deployment status, completeness, certification, or live data-provider connectivity.

## Evidence requirements

- Use real connected records only. Do not fabricate telemetry, incidents, customers, metrics, scan results, certifications, or provider status.
- Distinguish `IMPLEMENTED`, `CONFIGURED`, `CONNECTED`, and `VERIFIED` states where applicable.
- Preserve uncertainty as `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`.
- A passing unit/self-test is not a substitute for a live authorized production handshake, external scan, tenant-isolation proof, or source-attributed finding.
- Security testing must remain within an explicitly authorized scope and applicable Rules of Engagement.

## Release checklist

1. Install dependencies reproducibly with `npm ci`.
2. Run typecheck, lint, self-tests, production configuration checks, runner handshake checks, and the production build.
3. Apply database migrations only to the explicitly approved target database; preserve existing data and review destructive changes before execution.
4. Verify signup/login, verification and recovery flows, session revocation, tenant isolation, authorization boundaries, and migration state.
5. Verify runner health and signed challenge-response with production configuration.
6. Verify external providers with authorized credentials and source-attributed records.
7. Promote only the commit that passed required release gates; record the commit SHA and observed verification results.

## Canonical build rule

`terrell0780/elitze-agentic-security` is the canonical ELITZE Agentic Security repository. Keep one authoritative product build and do not create competing product repositories or claim deployment success without direct evidence.
