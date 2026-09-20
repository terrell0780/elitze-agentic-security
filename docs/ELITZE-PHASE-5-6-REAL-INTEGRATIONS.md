# ELITZE Phase 5–6 — Real Security Graph and First Integrations

## Scope

Phase 5 connects the console to tenant-scoped security-graph records. The console displays only records persisted by ELITZE and labels missing evidence as unavailable/unknown rather than inventing posture or risk values.

Phase 6 initially supports only:

1. MCP — discovery, tool inventory, gateway proxy, deterministic policy enforcement, request/response metadata, and tool-description change detection.
2. GitHub — repository metadata, GitHub App installation metadata when authorized, Actions workflows, protected branches, Actions secret metadata without secret values, and organization audit-log events when the token has that permission.
3. AWS — STS caller identity, IAM roles, IAM customer-managed policy metadata, and CloudTrail events using SigV4-authenticated API calls.

Entra ID and Kubernetes are intentionally outside this implementation boundary until MCP, GitHub, and AWS have been verified end to end.

## No synthetic posture

The implementation has no seeded agents, fake tool calls, fabricated assets, simulated reachability, invented risk scores, or synthetic operational telemetry. A provider that is not configured returns `UNAVAILABLE`/`UNKNOWN` and the console does not substitute a value.

## MCP graph projection

Every successful `tools/list` through the gateway persists the observed tool description and input schema hash. A changed description produces a new observation timestamp and retains the previous description hash. The observed graph contains the real agent → MCP server → tool relationships and marks them `OBSERVED`.

## GitHub observation endpoint

`POST /api/integrations/github/observe`

Request body:

```json
{"tenantId":"<tenant>","repository":"owner/repository"}
```

The endpoint is internal-key protected and requires `GITHUB_TOKEN`. Secret values are never retrieved; only metadata is recorded.

## AWS observation endpoint

`POST /api/integrations/aws/observe`

Request body:

```json
{"tenantId":"<tenant>"}
```

The endpoint is internal-key protected and requires AWS credentials in the deployment secret manager. It observes STS, IAM and CloudTrail through signed requests. It does not execute containment.

## Console graph

Authenticated console users receive their own tenant's graph at `/api/console/security-graph`. The console displays actual observed nodes and relationships only. It does not calculate an overall risk score from missing evidence.

## Production verification boundary

Repository implementation is not the same as a live integration. End-to-end status remains `UNMEASURABLE` until the production database is migrated, real provider credentials are configured, a real provider account/repository is reachable, and captured observations and evidence can be independently inspected.
