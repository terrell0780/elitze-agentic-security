# ELITZE production integrations — Agent Identity and MCP Runtime Security

## Scope

The first five production integration paths are deliberately limited to ecosystems that expose agent identity, tool execution, workload identity, authorization, or runtime evidence:

1. MCP Gateway / Server
2. GitHub + GitHub Actions
3. AWS IAM + CloudTrail
4. Microsoft Entra ID + Azure
5. Kubernetes

These integrations are not decorative data imports. Each adapter has a specific security job and must feed the ELITZE control loop.

## Control path

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove`

### MCP Gateway / Server

**Discovery:** MCP `server/discover` and tool capability metadata.

**Identity / reachability:** server identity, tool identity, client identity metadata, protected-tool authorization scope.

**Policy:** sensitive `tools/call` requests are evaluated before execution through the ELITZE policy boundary.

**Evidence:** request/decision records plus observed tool outcomes are retained in the ELITZE audit/evidence path.

The adapter targets the MCP `2026-07-28` wire/authentication model; authorization failures and unavailable servers remain explicit integration failures, not inferred success.

### GitHub + GitHub Actions

**Discovery:** repository and workflow metadata.

**Identity / reachability:** repository owner, workflow identity and configured deployment relationships.

**Policy:** ELITZE can use repository/workflow context when evaluating agent or release actions.

**Evidence:** workflow-run events and repository metadata become observed evidence for release/runtime verification.

GitHub Actions OIDC should be preferred for cloud federation instead of long-lived cloud credentials where supported. citeturn563073search0turn563073search3

### AWS IAM + CloudTrail

**Discovery:** CloudTrail activity and IAM-authenticated request context.

**Identity / reachability:** IAM principal identity and observed AWS API actions.

**Policy:** AWS activity can be correlated with ELITZE identity/purpose/capability policy decisions.

**Evidence:** CloudTrail events provide account activity history, including principal, service, action and request context. citeturn803755search5turn803755search11

### Microsoft Entra ID + Azure

**Discovery:** Microsoft Graph directory context and Entra activity.

**Identity / reachability:** users, applications, service principals and directory activity can be correlated with agent/workload identity.

**Policy:** ELITZE uses the observed identity context to evaluate authorization and high-impact actions.

**Evidence:** Entra audit/sign-in activity can be accessed through Graph and routed through Azure Monitor or SIEM integrations. citeturn563073search4turn563073search10

### Kubernetes

**Discovery:** Kubernetes API version, API groups, RBAC resources and workloads through the authenticated API endpoint.

**Identity / reachability:** service accounts, RBAC relationships and workloads form the runtime identity/reachability graph.

**Policy:** ELITZE can evaluate Kubernetes workload actions against identity, capability and data-access policy before authorized execution.

**Evidence:** authenticated API responses and authorized runtime events are retained as observed evidence.

## Production truth rule

An adapter being present in the repository does **not** make it an integrated production connection.

Status rules:

- `IMPLEMENTED` — code path exists and is verifiably operating in the deployed environment.
- `INTEGRATED` — credentials/configuration are present and a live authenticated provider path has been verified.
- `BLOCKED` — required provider credentials, permissions, endpoint, tenant, cluster or other dependency is missing.
- `UNKNOWN` / `UNMEASURABLE` — the provider returned insufficient evidence to establish the requested state.

No sample credentials, mock provider responses, fake assets, synthetic workflow runs, invented CloudTrail events, invented Entra identities, fabricated Kubernetes objects, or simulated MCP calls may be used to turn `BLOCKED` into `INTEGRATED`.

## Required connection evidence

For each integration, production acceptance requires:

1. real tenant/account/cluster ownership or authorization;
2. authenticated connection using the provider's supported security mechanism;
3. least-privilege permission review;
4. real discovery result;
5. normalized observed record persisted through the ELITZE Data Bridge;
6. policy decision tied to an observed identity/action;
7. evidence record with content hash / audit lineage;
8. real observation of the resulting action or provider event;
9. retest of the original risk/path;
10. explicit final state: verified, unresolved, or insufficient reach.

Until these conditions are met, public product copy must describe the connector as implemented/configurable rather than claim live integration or coverage.
