# ELITZE Agentic Security — Product Capabilities

This document defines the **initial commercial category** and prevents the sales surface from treating broad architecture as simultaneously proven production capability.

## Initial category

**Agent Identity and MCP Runtime Security**

## Initial product promise

> Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.

## Required end-to-end control path

| Stage | Required evidence | Sales status |
|---|---|---|
| Agent / MCP discovery | Real tenant-scoped discovery record | Must be verified in deployment |
| Workload identity | Real identity record with cryptographic verification material | Must be verified in deployment |
| Reachability | Real identity → tool/API/secret/data relationships | Must be verified in deployment |
| Policy evaluation | Real request + enabled policy + decision | Repository control exists; runtime verification required |
| Decision | Allow / deny / approval / constraint result | Repository control exists; runtime verification required |
| Evidence | Hash-linked request/decision evidence | Repository audit/evidence controls exist; runtime verification required |
| Authorized execution | Separately authorized gateway/execution path | Executor must be configured and tested |
| Runtime observation | Actual execution outcome from connected source | Deployment/integration verification required |
| Retest | Authorized retest of the affected path | Deployment/integration verification required |
| Risk closure | Evidence showing whether the affected condition was removed | Must never be inferred from status alone |

## Explicit non-claims

ELITZE does **not** treat the following as proven initial-category claims merely because supporting architecture exists elsewhere in the repository:

- broad cloud posture;
- generic application security;
- full enterprise SOC consolidation;
- generalized vulnerability operations;
- arbitrary third-party integrations;
- counterfactual or copied-graph simulation;
- fabricated or synthetic operational telemetry.

These may exist as secondary architecture or future scope, but public and sales-facing claims must use the actual implementation state.

## Production truth

- No mock data.
- No fake data.
- No synthetic operational metrics.
- No simulated security events represented as real.
- No placeholder success state.
- No invented customers, assets, agents, findings, reachability, remediation, savings, rankings, or integrations.
- Missing evidence is shown as missing, `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH` as appropriate.

## REO / RIO / ROE

**REO:** evidence-backed retesting of an actual reachable or exploitable condition.

**RIO:** observed security outcomes separated from customer-approved financial assumptions; no invented ROI values.

**ROE:** authorized validation scope and execution rules for security testing, with evidence retained for the actual activity performed.

## Google 2026 publishing boundary

Public pages and advertising must accurately describe the available product and destination. No fabricated testimonials, ratings, customer counts, rankings, performance statistics, Google affiliation, endorsement, partnership, preferred placement, guaranteed ranking, guaranteed traffic, guaranteed conversion, or special access claims. Offers and prices advertised must be available at the destination. Search content must remain useful, original, relevant, and people-first rather than scaled low-value generated pages.
