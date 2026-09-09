# Mythos — Production Security Orchestration

Mythos is the executive orchestration layer for ELITZE. It routes security and intelligence objectives to specialized capability domains while keeping every action inside the ELITZE identity, policy, evidence and audit boundaries.

## Implemented now

- Governed task intake with strict schema validation at `POST /api/mythos`.
- Deterministic routing for threat hunting, vulnerability analysis, incident response, OSINT, corporate research, fraud analysis, memory capture and report review.
- Tenant and agent identity requirements.
- MCP server identity enforcement for MCP actions.
- Policy evaluation through the existing ELITZE policy engine.
- Audit-backed decision and execution records.
- High-impact action detection that forces approval instead of direct execution.
- Guarded execution interface (`MythosActionExecutor`) for real security adapters.
- Explicit `BLOCKED`, `APPROVAL_REQUIRED` and `READ_ONLY` execution states.

## Specialized units

### Mythos Agent
Executive orchestration, routing and control-boundary enforcement.

### Mythos-SecOps
Security operations routing for threat hunting, vulnerability analysis and incident response. The orchestration contract is implemented; actual telemetry and response systems remain adapter-driven and must be connected to authorized production systems before they are represented as active capabilities.

### Mythos Intelligence
OSINT and investigative routing. Production source connectors must provide provenance, source trust and tenant authorization.

### Mythos Memory
Knowledge and evidence routing. Persistent memory requires a tenant-scoped datastore and retention/access policy before it is considered production-complete.

### Mythos Review
Evidence and impact validation for high-risk conclusions, fraud analysis, incident response and published reporting.

## Security boundary

Mythos does not treat model output as authority. An objective is routed first, then checked by the gateway and policy engine. High-impact actions require approval; hard policy failures block execution. Execution is only possible when an application supplies a real, authorized `MythosActionExecutor` adapter.

This keeps the orchestration layer useful today without falsely claiming that external EDR, SIEM, SOAR, OSINT or memory systems are connected when they are not.
