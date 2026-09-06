# ELITZE Agentic Security — Final Canonical Manifest

## Product identity

One product: **ELITZE Agentic Security**.

No duplicate security product, dashboard, graph, policy engine, or competing agent runtime is authorized.

## Authority order

1. Product Manifest
2. Security Architecture
3. Rules of Engagement (REO)
4. Policy
5. Implementation Specification
6. Code
7. Tests
8. Evidence

## Canonical security plane

```text
IDENTITY
  -> AGENT
  -> MODEL
  -> MCP SERVER
  -> MCP TOOL
  -> API
  -> APPLICATION
  -> WORKLOAD
  -> CLOUD/NETWORK RESOURCE
  -> DATA
  -> ACTION
  -> OUTCOME
  -> FINDING
  -> ATTACK PATH
  -> RISK
  -> REMEDIATION
  -> VERIFICATION
  -> EVIDENCE
```

The Security Truth Graph is the canonical relationship model.

## Truth states

`OBSERVED`, `DECLARED`, `INFERRED`, `UNKNOWN`, `UNMEASURABLE`.

Never fabricate missing telemetry or security facts.

## Agentic security

Every managed agent should have an Agent Passport defining owner, purpose, model, authorized capabilities/tools/MCP/APIs/data/network scope, execution window, policy and REO references, and current risk/containment state where observed.

Runtime action must be compared with authorized action. Decisions include `ALLOW`, `DENY`, `REQUIRE_APPROVAL`, `RESTRICT`, `PAUSE`, `REVOKE`, `ISOLATE`, and `CONTAIN` as permitted by policy/REO.

## Agent Reach

`terrell0780/Agent-Reach` is the external capability acquisition/configuration/routing layer. It is not the ELITZE security reachability engine.

External output from Agent Reach crosses an untrusted-content/provenance boundary before influencing ELITZE state or an agent decision.

## Skill security

`terrell0780/SkillSpector` is the specialized AI-agent skill scanner/admission component. Skills acquired through an authorized capability channel must pass the configured scan/admission gate before installation or activation.

Skill scan state and admission state are separate. A scanner failure is not a clean scan. Static-only and semantic analysis remain distinguishable.

## MCP/API security

Inventory and correlate MCP servers, MCP tools, agents, models, APIs, identities, resources, and actions. Preserve source and evidence for each relationship.

## Reachability

The ELITZE Reachability Engine independently evaluates evidence-backed paths. Valid states are `REACHABLE`, `NOT_OBSERVED_AS_REACHABLE`, `UNKNOWN`, and `UNMEASURABLE`.

`NOT_OBSERVED_AS_REACHABLE` is not equivalent to `NOT_EXPLOITABLE`.

## Attack paths

Attack paths require evidence-backed edges. The system must expose path nodes, edges, evidence, breakers, impact, and risk without inventing unobserved links.

## Dynamic risk

Risk is explainable and evidence-driven. Relevant factors include severity, exploitability, threat signals, active exploitation, exposure, reachability, privilege, agent/MCP/API reachability, data sensitivity, asset criticality, blast radius, path position, and compensating controls when those facts are available.

## Security Delta

Track material changes to code, dependencies, APIs, secrets, IAM, cloud resources, containers, artifacts, network exposure, MCP, agents, capabilities, models, authority, and external exposure.

## Offensive security

Pentesting and offensive workflows are constrained by explicit REO: targets, ownership, environment, methods, prohibited actions, time windows, rate limits, credentials, data handling, stop conditions, approval, and evidence requirements.

## Remediation

```text
FINDING -> ROOT CAUSE -> OPTIONS -> REO/POLICY CHECK -> APPROVAL -> CHANGE -> TEST -> DEPLOY -> RETEST -> VERIFY -> EVIDENCE
```

`VERIFIED_REMEDIATED` requires evidence.

## Release gate

```text
CODE
-> DEPENDENCY
-> SECRETS
-> IaC
-> CONTAINER
-> BUILD/ARTIFACT
-> API
-> AGENT
-> MCP
-> SECURITY TEST
-> AUTHORIZED PENTEST
-> FINDINGS
-> REMEDIATION
-> RETEST
-> VERIFICATION
-> RELEASE DECISION
```

## God’s Eye

God’s Eye is a read projection of the Security Truth Graph. Its interactive globe, node views, traces, and animations must use actual ELITZE observations. Missing geography is `null`. No synthetic attack traffic or fake locations are permitted.

## Evidence

Every claim should be traceable to source -> observation -> analysis -> decision -> evidence. AI-generated analysis is not automatically an observation.

## Production gate

A capability is production-ready only when implementation, integration, positive tests, negative tests, authorization, observability, evidence, and verification are complete. Otherwise its state must remain explicit (`UNKNOWN`, `UNAVAILABLE`, `FAILED`, or equivalent).
