# ELITZE AGENTIC SECURITY — Merge and Unified Deployment Manifest

Canonical repository: `terrell0780/elitze-agentic-security`.
Canonical product: **ELITZE Agentic Security**.
Canonical web control plane: `https://www.elitze.info` (apex `https://elitze.info` redirects to www).

## Unified platform architecture

The product is one integrated platform, not separate competing products or duplicate control planes.

- **ELITZE runtime orchestrator** — the executive control/orchestration layer. Runtime implementation: `src/lib/elitze-secure/elitze-agent.ts`; planning/API entrypoint: `POST /api/elitze`. It routes governed objectives across SecOps, Intelligence, Memory, and Review while applying gateway checks, policy evaluation, the defense fabric, and audit-ledger recording.
- **SARA (Sara)** — the operator-facing security assistant. It works within ELITZE's identity, policy, approval, and evidence boundaries; it does not grant its own authority.
- **Sentinel security layer** — the security-protection layer *within* ELITZE Agentic Security, not a separate product or separate control plane. In the canonical code, its responsibilities are represented by the defense fabric, gateway, deterministic policy engine, enforcement point, audit ledger, configured security adapters, and the scoped security runner. The word “Sentinel” is an architectural label; it does not by itself prove a provider connection or live runtime.
- **Persistent agent workflows** — tenant-scoped workflow definitions/runs, agent identity checks, human approval gates, bounded delegation, memory provenance, and recorded evidence/retest state in `src/lib/elitze-secure/agent-workflow.ts` and the `agent_workflows` migration family.
- **Agentic SOC** — a tenant-authenticated LangGraph analysis path. Only tenant-scoped `OBSERVED` source events are analyzed; model review cannot invent findings or change source severity.
- **Security runner** — the execution tier under `runner/`, using signed requests, explicit scope/profile authorization, target allowlists, safety checks, fixed Nuclei execution, and signed callbacks. It is subordinate to the ELITZE control plane, not a standalone ELITZE product.
- **Frontend and data plane** — the Next.js console/API and tenant-scoped database are the shared operating surface and source of persisted workflow, identity, policy, and evidence state.

## Code and deployment boundaries

- `src/lib/elitze-secure/elitze-agent.ts` is the runtime orchestrator. It is distinct from the CI helper.
- `generated/elitze_orchestrator.py` is a bounded CI self-test/evidence wrapper for the allowlisted runner handshake. It is **not** the runtime orchestrator and must not be treated as the agent that routes product work.
- `src/app/api/elitze/route.ts` currently plans and records a governed task. A returned plan is not proof that an external action was executed.
- `ElitzeActionExecutor` is an execution interface. External action execution is only available when a real, authorized executor/adapter is supplied and the applicable controls permit it.
- `src/lib/elitze-secure/agent-workflow.ts` persists workflows; a schedule stored in the database is not proof that a production scheduler/worker is running.
- The Railway runner must source the canonical repository and `runner/Dockerfile`, share the approved HMAC key with the Vercel control plane and GitHub release gate, and pass public health plus signed handshake verification. An old service sourced from a different repository is not accepted as this canonical runner.

## Imported security foundations

Imported into the canonical build:
- typed security decisions and hard-gate semantics;
- policy engine foundation;
- hash-chained audit ledger foundation;
- security graph foundation;
- agent risk evaluation;
- ELITZE REO content-integrity decision logic;
- generation/runtime enforcement foundation;
- CVE/KEV/EPSS exposure-prioritization foundation.

## Non-negotiable evidence rules

- Real connected records only: no mock data, fake telemetry, placeholder success, synthetic operational metrics, or invented findings.
- Each action is bounded by authenticated identity, tenant scope, applicable policy, approval and ROE requirements, an authorized execution path, observation, and evidence.
- Unknown or unavailable capability remains `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`; code presence and passing self-tests are not live-provider proof.
- The canonical ELITZE Agentic Security repository is the only product build target.
