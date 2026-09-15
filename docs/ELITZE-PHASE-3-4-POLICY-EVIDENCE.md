# ELITZE Phase 3–4 — Deterministic Policy + Signed Evidence

## Phase 3: policy decision point

ELITZE evaluates authorization with deterministic controls. An LLM is not used as the final authorization engine.

Supported policy fields:

- agent identity
- human owner
- tool
- action
- resource
- environment
- data classification
- UTC time window
- purpose
- impact level
- decision
- approver role
- approval expiration

A small YAML subset is accepted for policy registration. JSON is also accepted. The parser is intentionally constrained and rejects unsupported syntax rather than guessing.

Example:

```yaml
name: protect-production-github
subject:
  agent: coding-agent
action:
  tool: github.delete_branch
resource:
  environment: production
decision: require_approval
approvers:
  role: security-admin
expiresAfter: 15m
```

Policy conflicts resolve deterministically from most restrictive to least restrictive:

`DENY > REQUIRE_APPROVAL > ALLOW_WITH_CONSTRAINTS > ALLOW`

An unmatched request falls back to the MCP gateway's deterministic safety rules. No model response can override the gateway decision.

## Phase 4: evidence

Each evaluated MCP tool call creates an append-only decision/evidence record. Records contain the identity chain, purpose, requested capability, tool, resource, decision, policy reference, UTC request/observation timestamps, evidence source, evidence state, freshness, previous record hash, record hash, and HMAC signature.

Supported evidence states are:

`OBSERVED | INFERRED | SIMULATED | UNKNOWN | UNMEASURABLE`

The production MCP gateway writes `OBSERVED` for requests and upstream outcomes it actually sees. ELITZE does not convert missing telemetry into observed evidence.

`mcp_gateway_decisions` is protected by a database trigger that rejects updates and deletes. New evidence is appended instead of modifying prior records.

## Export and verification

JSON export:

`GET /api/mcp-gateway/evidence/export?tenantId=<tenant>&format=json`

PDF export:

`GET /api/mcp-gateway/evidence/export?tenantId=<tenant>&format=pdf`

Exports require the ELITZE internal API key and a tenant scope.

Offline verification:

```bash
ELITZE_EVIDENCE_SIGNING_SECRET=... node scripts/verify-evidence.mjs evidence.json
```

The verifier checks record ordering, previous-hash continuity, SHA-256 record hashes, and HMAC signatures.

## Operational boundary

Repository implementation is not the same as live production proof. A production claim requires the migration to be applied, real signing secrets configured, a real workload session issued, a real MCP server reachable through the gateway, and export/verification evidence from that environment.