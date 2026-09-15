# ELITZE Agent Identity and MCP Runtime Security Contract

## Purpose

This contract defines the real production control path for the initial ELITZE category.

**Product promise:** Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.

## Production invariant

A production claim is valid only when the corresponding record exists in the connected tenant-scoped data path.

No mock records, seeded demo records, synthetic telemetry, simulated events, copied security graphs, placeholder metrics, or fabricated outcomes are permitted in production mode.

## Control path

`Discovery → Workload Identity → Reachability → Policy → Decision → Evidence → Authorized Gateway → Runtime Observation → Retest → Verified State`

### 1. Discovery

A real connected source discovers an agent, model, MCP server, or tool. The record must include tenant scope, source, observed timestamp, and stable identity/reference information.

### 2. Workload identity

The workload receives an identity that can be cryptographically verified. Identity material must be bound to the workload and tenant and must not rely on display names alone.

### 3. Reachability

ELITZE records actual observed relationships from the workload identity to tools, APIs, secrets, data, and other resources. Unobserved reachability is not rendered as confirmed reachability.

### 4. Policy

Every sensitive action is evaluated against an enabled, versioned ELITZE policy. The evaluation must include tenant, subject identity, action, MCP/tool identity when relevant, and data classification when known.

### 5. Decision

The enforcement result is explicit: `APPROVE`, `BLOCK`, or `REVIEW`/approval where the workflow requires human authorization. No UI success state substitutes for the stored decision.

### 6. Evidence

The request and decision are persisted with tamper-evident evidence. Evidence must identify the tenant, subject, action, policy/version, decision, timestamp, and content hash or equivalent integrity mechanism.

### 7. Authorized gateway

Execution is separated from policy evaluation. A sensitive action is executed only through a separately authorized runtime/gateway path. If the executor is unavailable or not authorized, ELITZE fails closed rather than claiming execution occurred.

### 8. Runtime observation

The outcome must come from the actual connected execution path or an authorized downstream observation source. A successful policy decision is not evidence that execution succeeded.

### 9. Retest

The affected path or control is retested using authorized security validation. The retest result must identify what was tested and what evidence was produced.

### 10. Verified state

The condition is considered reduced or removed only when the retest evidence supports that conclusion. A ticket closure, status update, model response, or operator assertion alone is insufficient.

## Console truth requirement

Every operational card must resolve to an actual record or an explicit unavailable state. The UI must never manufacture counts, percentages, trends, health states, findings, reachability, remediation, or savings.

When evidence is insufficient, use:

- `UNKNOWN`
- `UNMEASURABLE`
- `INSUFFICIENT_REACH`
- empty state with the missing dependency identified

## Release acceptance

A feature cannot be marked complete until it can demonstrate the relevant portion of the control path against real authorized records in a deployed environment.

## Google 2026 publishing boundary

Public pages and Google advertising must accurately describe the functionality and offers available at the destination. ELITZE must not claim Google endorsement, partnership, preferred placement, guaranteed ranking, guaranteed traffic, guaranteed conversion, or special access without a real authorized relationship. Claims must not be misleading or unreliable, advertised offers must actually be available at the destination, and public content should remain useful, original, relevant, and people-first rather than scaled low-value generated content.

See the official Google Search Essentials, Search spam policies, AI-feature guidance, and Google Ads misrepresentation policies before publishing claims.
