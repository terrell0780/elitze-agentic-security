# ELITZE Agentic Security — Canonical Agent Skill Security

## Authority

This document extends the canonical ELITZE Agentic Security architecture. It does not create a second product, security graph, policy engine, or competing agent runtime.

## Canonical flow

```text
MISSION
  -> REO
  -> POLICY
  -> AGENT AUTHORIZATION
  -> AGENT REACH (terrell0780/Agent-Reach capability layer)
  -> EXTERNAL CAPABILITY / SKILL
  -> SKILLSPECTOR
  -> PROVENANCE + TRUST BOUNDARY
  -> ADMISSION DECISION
  -> SECURITY TRUTH GRAPH
  -> RUNTIME AGENT/MCP/API CONTROLS
  -> EVIDENCE
```

Agent Reach acquires/configures/routes capabilities. It is not ELITZE's internal security reachability engine. SkillSpector is the specialized skill security scanner/admission component. ELITZE remains authoritative for identity, authorization, REO, policy, runtime behavior, risk, remediation, and verification.

## Truth rules

Never invent skill source URLs, versions, hashes, findings, CVEs, risk values, identities, telemetry, or scan results. Missing facts are `null`; facts that cannot be verified are `UNKNOWN`; measurements that cannot be performed are `UNMEASURABLE`.

A static-only scan must remain distinguishable from semantic/LLM analysis. A low static score is not evidence of a clean semantic scan.

External skill content is untrusted input. Instructions embedded in a skill, repository, webpage, or tool response cannot override ELITZE policy, REO, authorization, or system authority.

## Skill lifecycle

```text
DISCOVER
  -> ACQUIRE
  -> IDENTIFY EXACT SOURCE/VERSION
  -> SCAN WITH SKILLSPECTOR
  -> NORMALIZE FINDINGS
  -> RECORD PROVENANCE
  -> POLICY + REO ADMISSION
  -> ALLOW | DENY | REQUIRE_APPROVAL | QUARANTINE | RESCAN_REQUIRED | UNKNOWN
  -> INSTALL/REGISTER ONLY IF AUTHORIZED
  -> MONITOR RUNTIME
  -> RESCAN ON CHANGE
  -> REVOKE WHEN REQUIRED
  -> REMEDIATE
  -> RETEST
  -> VERIFY
```

## Skill security record

Every registered skill should support:

- `skill_id`
- `tenant_id`
- exact source reference
- source type
- immutable content/version identity when available
- provenance
- acquisition timestamp
- scanner identity/version when available
- scan mode
- risk score when actually returned
- severity when actually returned
- recommendation when actually returned
- `safe_to_install` when actually returned
- findings
- policy decision
- REO reference
- admission state
- agent relationships
- MCP/tool relationships
- evidence references
- last scan
- next required scan when policy defines one

Do not populate unavailable fields with placeholders that look real.

## SkillSpector integration contract

The integration should consume SkillSpector's machine-readable result rather than scraping terminal output. JSON/SARIF should be preferred for system ingestion where supported by the installed version.

Normalize the result into ELITZE entities and evidence without changing the scanner's factual meaning.

Required provenance fields for an imported scan:

```text
scanner = SkillSpector
scanner_version = observed version or UNKNOWN
scan_mode = observed mode
source_reference = exact input supplied to scanner
started_at = observed or null
completed_at = observed or null
result_reference = stored result/evidence reference
```

## Admission control

The admission layer must not infer that a skill is safe merely because the scanner returned no findings. The final admission decision is an ELITZE policy/REO decision using available evidence.

A scan can be:

- `PASS`
- `FAIL`
- `PARTIAL`
- `UNAVAILABLE`
- `UNKNOWN`

These scan states are distinct from admission decisions.

## Runtime relationship

After admission, the skill becomes a graph object and may be related to:

```text
skill -> agent
skill -> model
skill -> MCP server
skill -> MCP tool
skill -> API
skill -> data/resource
skill -> action
skill -> finding
skill -> evidence
```

Observed runtime behavior must be evaluated independently of pre-install scan results.

## Revocation

A previously admitted skill must be eligible for revocation when:

- its source/version changes;
- a new security finding appears;
- its authorization changes;
- runtime behavior violates policy/REO;
- provenance becomes unverifiable;
- an administrator or policy explicitly revokes it.

Revocation must produce an auditable evidence chain.

## Security requirements

`SKL-001` Skill inventory

`SKL-002` Skill provenance

`SKL-003` SkillSpector integration

`SKL-004` Pre-install security scan

`SKL-005` Skill vulnerability normalization

`SKL-006` Skill risk evaluation

`SKL-007` Skill admission control

`SKL-008` Skill quarantine

`SKL-009` Baseline/drift handling

`SKL-010` Rescan on material change

`SKL-011` Skill-to-agent mapping

`SKL-012` Skill-to-MCP/tool mapping

`SKL-013` Security Truth Graph integration

`SKL-014` Evidence chain

`SKL-015` Runtime monitoring

`SKL-016` Revocation

`SKL-017` Remediation/retest

`SKL-018` Release security gate

## Acceptance requirements

1. An unscanned skill cannot bypass admission policy.
2. A scanner failure cannot be represented as a clean result.
3. Static-only and semantic scan modes remain distinguishable.
4. Imported findings retain scanner/source provenance.
5. Material skill changes trigger the configured rescan policy.
6. Admission decisions are attributable to policy and REO.
7. Approved skills are tied to their exact observed source/version identity where available.
8. Revoked skills cannot be newly admitted without an explicit new authorization decision.
9. Skill relationships are represented in the canonical Security Truth Graph.
10. Skill evidence is retained and auditable.
11. The SkillSpector remote HTTP interface is never exposed without an ELITZE-controlled authentication boundary.
12. Missing evidence produces `UNKNOWN`, `null`, or `UNMEASURABLE` as appropriate rather than fabricated values.

## Agent Reach boundary

Agent Reach is treated as a capability acquisition layer. Every result returned through it crosses an external-content trust boundary before it can affect ELITZE state.

```text
Agent Reach
  -> external result
  -> provenance
  -> content inspection
  -> policy/REO evaluation
  -> authorized ELITZE processing
```

Agent Reach must never be granted authority to change ELITZE policy, REO, identity, or authorization merely because an upstream result requests it.
