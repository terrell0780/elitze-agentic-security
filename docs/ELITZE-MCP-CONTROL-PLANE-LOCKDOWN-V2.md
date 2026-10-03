# ELITZE MCP Control Plane Lockdown v2

This control-plane contract treats the ELITZE MCP Gateway as a privileged security boundary.

## Enforcement

- Workload tokens are cryptographically bound to the tenant, human owner, application, agent identity, workload session, and exact MCP server.
- Workload tokens require a non-empty JTI and a subject equal to the workload session.
- Delegated capabilities are explicit exact tool names. Wildcards and substring matches are rejected.
- MCP discovery returns only tools authorized by the active workload delegation.
- MCP execution is fail-closed when the global gateway or execution kill switch is disabled.
- State-changing MCP requests are rate-limited per tenant/workload session/method.
- Reusing a request ID within a workload session is rejected before execution.
- Destructive or otherwise approval-required operations create a persisted approval request and cannot execute until that exact approval is approved, unexpired, tenant-bound, owner-bound, agent-bound, action-bound, and target-bound.
- MCP upstreams require HTTPS, reject embedded credentials, reject localhost/private/link-local/CGNAT/benchmark/multicast addresses, reject redirects, and cap response size.
- Downstream credential environment variables are limited to the explicit MCP gateway credential or a configured allowlist.
- MCP decision evidence is appended under a tenant-scoped PostgreSQL advisory transaction lock so concurrent writers cannot race the previous-hash chain.

## Emergency controls

Set these deployment variables to stop the gateway without changing application code:

- `ELITZE_MCP_GATEWAY_ENABLED=false` — disables the complete MCP gateway.
- `ELITZE_MCP_GATEWAY_EXECUTION_ENABLED=false` — permits discovery while blocking tool execution.

For stronger egress control, configure:

- `ELITZE_MCP_UPSTREAM_HOST_ALLOWLIST=host1.example.com,host2.example.com`
- `ELITZE_MCP_CREDENTIAL_ENV_ALLOWLIST=ELITZE_MCP_SERVER_A_TOKEN,...`

## Evidence

The release gate includes the MCP workload identity self-test, clean migration verification, typecheck, lint, production build, security suite, and real authentication DB E2E.

No secret values or production credentials belong in the repository.
