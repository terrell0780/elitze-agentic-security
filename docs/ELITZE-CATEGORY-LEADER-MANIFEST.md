# ELITZE Category-Leader Manifest — September 2026

## Initial category

**Agent Identity and MCP Runtime Security**

ELITZE is intentionally narrowing its initial product promise so the security boundary can be demonstrated end-to-end with real, connected evidence.

## Initial product promise

> **Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.**

This is the primary product category and the standard for the initial commercial proof. Broader security domains may exist in the architecture, but they are not represented as simultaneously proven product claims unless the relevant live control path is implemented, connected, and verified.

## Ten-step control-plane proof

ELITZE's initial control path must support this sequence against real tenant data:

1. Discover an agent, model, MCP server, or tool.
2. Assign a cryptographically verifiable workload identity.
3. Enumerate reachable tools, APIs, secrets, and data.
4. Evaluate an action against an enabled policy.
5. Return an explicit decision: allow, deny, review/approval, or constrain.
6. Record the request and decision as tamper-evident evidence.
7. Execute only through a separately authorized gateway or enforcement point.
8. Observe the actual result from a connected source.
9. Retest the affected path or control.
10. Preserve evidence proving whether the relevant risk condition was removed.

A feature is not considered complete because a UI state changes. The underlying record, authorization, execution result, retest result, and evidence must exist in the connected control path.

## Production truth rules

- **No mock data.**
- **No fake telemetry.**
- **No synthetic operational metrics.**
- **No simulated security events presented as real.**
- **No counterfactual or copied-graph simulation represented as an operational security control.**
- **No placeholder success states.**
- **No invented customers, assets, agents, findings, reachability, remediation, savings, rankings, or integrations.**
- Empty or unavailable data must remain visibly empty, unavailable, `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH` as appropriate.
- Every security decision must be traceable to a real request, tenant scope, identity, policy evaluation, and evidence record.

## Implementation states

Use only these states:

- **IMPLEMENTED** — live and verifiable in the deployed product.
- **INTEGRATED** — the connector/control exists and has a configured working path against authorized data.
- **PLANNED** — specified but not shipped.
- **BLOCKED** — cannot operate until a required dependency or capability exists.

The UI must never represent `PLANNED` or `BLOCKED` as active protection.

## Initial scope

The initial product surface prioritizes:

- agent discovery and inventory;
- MCP server and tool inventory;
- workload/non-human identity;
- identity-to-capability and reachability mapping;
- secrets and sensitive-data reachability;
- policy enforcement before tool execution;
- approval boundaries for sensitive actions;
- gateway execution authorization;
- tamper-evident decision evidence;
- observed runtime outcomes;
- retesting and evidence-backed closure.

Broader capabilities such as general cloud posture, broad application security, full SOC consolidation, generalized vulnerability operations, and advanced exposure analysis remain secondary unless their complete live control path is independently verified.

## Google 2026 public-claim guardrail

ELITZE public pages and advertising must describe only capabilities and offers that are actually available at the destination. No claims of Google endorsement, partnership, preferred placement, guaranteed rankings, guaranteed traffic, guaranteed conversions, or special Google access are permitted without a real authorized relationship. Public pages must not manufacture testimonials, customer counts, reviews, performance statistics, rankings, or other trust signals.

Google Search guidance requires helpful, reliable, people-first content and prohibits spam practices such as scaled low-value generated content. Google Ads policies prohibit misleading representation, unreliable claims, unclear relevance, and unavailable offers. These constraints are treated as product publishing requirements, not optional marketing guidance.

## Release gate

Every production release must answer:

**Can ELITZE demonstrate the complete agent/MCP identity-to-decision-to-execution-to-retest evidence path using real connected records?**

If the answer is no, the feature is not complete and the public product must not imply otherwise.
