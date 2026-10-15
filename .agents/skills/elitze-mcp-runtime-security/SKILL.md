---
name: elitze-mcp-runtime-security
description: Design and review ELITZE agent identity, MCP server discovery, tool reachability, pre-execution policy, approvals, runtime observations, and tamper-evident evidence.
---

# ELITZE Agent Identity and MCP Runtime Security

Apply this skill when changing agent identities, MCP servers, tools, workload identity, reachability graphs, authorization decisions, execution adapters, or runtime evidence.

## Required control loop

Follow this sequence without skipping a boundary:

Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove

The control-plane path must preserve:

Identity → Tenant Scope → Policy → Approval → Adapter → Execution → Verification → Evidence → Audit

## Verification checklist

1. Identify the caller, tenant, agent/workload identity, MCP server identity, and exact tool/action being requested.
2. Resolve reachability from observed relationships. Do not infer reachability merely because a server or adapter exists.
3. Bind decisions to the specific identity, tenant, purpose, resource, action, and policy version where applicable.
4. Require deterministic policy authorization before sensitive tool execution. Missing identity, scope, credentials, or policy evidence must not default to allow.
5. Require explicit, durable, attributable, tenant-scoped, expiring approval for high-impact actions.
6. Enforce upstream endpoint allowlists and credential scopes at the adapter/network boundary. Do not rely on a model prompt to constrain network access.
7. Store only real observed provider results. Preserve timestamps, source identifiers, hashes, policy/approval references, and audit lineage where available.
8. Separate requested, queued, dispatched, executed, observed, verified, and remediated states. A dispatched job is not a completed test; an execution result is not independent proof of remediation.
9. Test denied cross-tenant access, unknown identities, stale approvals, replay/idempotency, malformed provider results, timeouts, unavailable integrations, and tampered evidence.
10. Keep unavailable sources as NOT_CONFIGURED, UNKNOWN, UNMEASURABLE, or INSUFFICIENT_REACH rather than fabricating a positive state.

## Release rule

A local self-test demonstrates only the code path it exercises. Claim an integration is live only after an explicitly authorized endpoint has authenticated successfully, performed real discovery or action, persisted attributable evidence, and passed the relevant retest.

Do not perform a live offensive test or production deployment without explicit authorization.
