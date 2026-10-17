# ELITZE orchestration — Production Security Orchestration

ELITZE orchestration is the executive orchestration layer for ELITZE Agentic Security. It routes security and intelligence objectives to specialized capability domains while keeping every action inside the ELITZE identity, policy, evidence and audit boundaries.

**Architecture rule:** Sentinel is the integrated security-protection layer within this platform, not a separate product or control plane. Its current code mapping is the gateway, deterministic policy engine, enforcement point, defense fabric, audit ledger, configured adapters, and controlled security runner. This name does not itself assert that external providers or the runner are live.

## Runtime implementation

- `src/lib/elitze-secure/elitze-agent.ts` — ELITZE runtime planning/orchestration, task routing, gateway/policy/fabric authorization, and audit-ledger records.
- `POST /api/elitze` — authenticated planning API. A plan response is not an executed result.
- `src/lib/elitze-secure/agent-workflow.ts` — tenant-scoped persistent workflow definitions and runs, agent identity validation, approval boundaries, bounded delegation, evidence and retest state.
- `src/lib/elitze-secure/agentic-soc-graph.ts` and `src/app/api/console/agentic-soc/route.ts` — authenticated, tenant-scoped Agentic SOC analysis.
- `runner/` — separate execution tier subordinate to the control plane, using signed calls and authorized-scope checks.
- `generated/elitze_orchestrator.py` — CI-only runner handshake self-test/evidence wrapper; it is not the product runtime orchestrator.

## Implemented control-plane contracts

- Governed task intake with strict schema validation.
- Deterministic routing for threat hunting, vulnerability analysis, incident response, OSINT, corporate research, fraud analysis, memory capture and report review.
- Tenant and agent identity requirements.
- MCP server identity enforcement for MCP actions.
- Policy evaluation through the ELITZE policy engine.
- Audit-backed decision and planning records.
- High-impact action detection that requires approval rather than direct execution.
- Guarded execution interface (`ElitzeActionExecutor`) for real security adapters.
- Explicit `BLOCKED`, `APPROVAL_REQUIRED` and `READ_ONLY` planning/execution states.

## Specialized units

### ELITZE orchestration Agent
Executive orchestration, routing and control-boundary enforcement.

### ELITZE orchestration-SecOps
Security operations routing for threat hunting, vulnerability analysis and incident response. The orchestration contract is implemented; telemetry and response systems remain adapter-driven until connected to authorized production systems.

### ELITZE orchestration Intelligence
OSINT and investigative routing. Production source connectors must provide provenance, source trust and tenant authorization.

### ELITZE orchestration Memory
Knowledge and evidence routing. Persistent memory requires tenant-scoped storage, provenance, and retention/access policy before it is considered production-complete.

### ELITZE orchestration Review
Evidence and impact validation for high-risk conclusions, fraud analysis, incident response and published reporting.

## Security boundary

ELITZE orchestration does not treat model output as authority. Objectives are checked by the gateway and policy engine. Hard policy failures block; high-impact actions require approval. Execution is possible only when a real, authorized `ElitzeActionExecutor` or equivalent controlled adapter is supplied.

The workflow migration stores schedules, but deployment of a scheduler/worker must be independently verified. External EDR, SIEM, SOAR, OSINT, memory, cloud, identity and endpoint systems must not be shown as active unless their authorized live connection and evidence are verified.
