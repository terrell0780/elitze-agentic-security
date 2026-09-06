# Agent Reach + SkillSpector Integration Contract

## Canonical repositories

- ELITZE: `terrell0780/elitze-agentic-security`
- Agent Reach: `terrell0780/Agent-Reach`
- SkillSpector: `terrell0780/SkillSpector`

Repository references are identifiers only. Runtime must record the exact resolved revision when it is actually installed or executed.

## Responsibility boundaries

| Component | Authoritative responsibility |
|---|---|
| ELITZE Policy | Security policy decisions |
| ELITZE REO | Operation-specific authorization |
| Agent Passport | Agent identity and authority |
| Agent Reach | Capability acquisition/configuration/routing |
| SkillSpector | Skill security scanning |
| Security Truth Graph | Canonical security relationships |
| Reachability Engine | Security reachability analysis |
| Evidence | Proof of observed claims |

No component may silently assume another component's authority.

## Installation/admission gate

```text
REQUEST SKILL/CAPABILITY
  -> authenticate actor
  -> evaluate REO
  -> evaluate policy
  -> acquire through authorized Agent Reach channel
  -> capture exact source/revision when available
  -> scan with SkillSpector
  -> persist scan + provenance + evidence
  -> evaluate admission policy
  -> ALLOW / DENY / REQUIRE_APPROVAL / QUARANTINE / RESCAN_REQUIRED / UNKNOWN
```

If acquisition succeeds but scanning fails, the skill is not a clean result. The scan state is `UNAVAILABLE` or `UNKNOWN` and admission must follow policy; it must not silently become `ALLOW`.

## External content boundary

Agent Reach output is untrusted external content. It must be isolated from ELITZE control instructions before any agent consumes it. External text cannot change REO, policy, authorization, tenant, or system state merely by containing instructions.

## Scanner provenance

Store, when available:

- scanner name
- scanner version
- exact source reference
- source revision/content digest
- scan mode
- start/end timestamps
- raw result reference
- normalized result
- evidence reference

Unavailable values remain `null`/`UNKNOWN`.

## HTTP security boundary

SkillSpector documents an unauthenticated HTTP transport. ELITZE must not expose that service directly. If remote execution is required, place it behind ELITZE authentication/authorization and a controlled network boundary. Local file and `file://` access must never become remotely reachable through an unauthenticated scanner endpoint.

## Runtime monitoring

Pre-install scanning does not establish runtime safety. Once admitted, the skill must be represented in the Security Truth Graph and its actual agent/MCP/API actions must be evaluated against the Agent Passport, Policy, and REO.

## Drift

Material changes to a skill's source, revision, content digest, permissions, connected tools, MCP relationships, or observed behavior must be eligible to trigger rescan/review/revocation according to policy.

## Truth-preserving normalization

The adapter must never manufacture findings, CVEs, hashes, risk scores, versions, coordinates, or safe/unsafe claims. If SkillSpector does not return a value, the ELITZE record remains absent/null/UNKNOWN as appropriate.
