---
name: elitze-integration-verification
description: Verify ELITZE provider integration authentication, tenant binding, source provenance, freshness, and end-to-end evidence.
---

# ELITZE Integration Verification

An adapter, environment variable, UI card, documentation page, build, or mock fixture is not proof of a live integration.

## Verification procedure
1. Name the provider, environment, tenant/account/cluster, endpoint, required permissions, and credential source.
2. Confirm credentials are read server-side from an approved secret manager or environment. Never print tokens or persist secret values.
3. Make a low-risk authenticated request to the real provider.
4. Validate response identity and schema; enforce tenant binding; normalize and persist the observation idempotently.
5. Confirm authorized read-back and prove cross-tenant access is denied.
6. Record sanitized evidence: provider, source identity, timestamp, status, request/correlation ID, resulting record IDs, permission scope, and test/CI link.
7. Test invalid credentials, missing permissions, timeouts, malformed payloads, stale data, replays/duplicates, and unavailable-provider behavior.
8. Mark INTEGRATED only after the live authenticated request and persisted outcome are verified. Otherwise use BLOCKED, UNKNOWN, UNMEASURABLE, or INSUFFICIENT_REACH with the reason.

## Security requirements
- Prefer OIDC/federation and short-lived credentials where supported.
- Never log auth headers, bearer tokens, client secrets, or sensitive payloads.
- Apply timeouts, payload bounds, schema validation, idempotency, rate limits, and outbound destination policy.
- Treat all provider data as untrusted input.
- Do not turn source failure into empty or no-risk telemetry.
- Verify provider state after remediation or containment; do not trust only a local status transition.
