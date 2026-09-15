# ELITZE Phase 2 — Real Identity Model

## Control objective

Every MCP action must carry a traceable identity chain:

`Human owner → application → agent → delegated session → MCP server → tool → external resource`

The gateway must be able to answer who authorized an action, which workload session carried it, why the action was requested, what capability was requested, what tool/resource was targeted, which approval authority applied, and when the authorization expires.

## Persisted identity data

`workload_sessions` stores:

- tenant
- human owner
- application
- agent identity
- delegation source
- purpose
- requested capability
- approval authority
- signed-token hash and key id
- issuance and expiration
- revocation state

`workload_delegations` stores the delegated chain and optional tool/resource/credential reference for the session.

`mcp_gateway_decisions` links gateway decisions back to the workload session and records the human owner, application, delegation source, purpose, requested capability, approval authority, and expiration alongside the signed decision evidence.

## Credential boundary

Agents receive short-lived ELITZE workload tokens. Provider credentials remain gateway-side and are referenced by environment-variable name only. The MCP gateway resolves the provider credential at execution time and never includes the provider secret in the agent token or agent-visible authorization context.

Workload tokens are HMAC-SHA256 signed, expire automatically, and are bounded to a specific tenant, agent identity, application, human owner, delegation source, purpose, requested capability, and workload session.

## Expiration

The token issuer clamps TTL to 30–900 seconds. Production configuration defaults to 300 seconds. Expired or revoked sessions are rejected before MCP discovery/call handling.

## Production claim boundary

Implemented in the repository:

- identity-chain schema
- short-lived workload token issuance
- token verification
- gateway enforcement of workload identity
- decision records linked to the identity chain
- CI self-test

Still requires live production verification:

- production database migration applied successfully
- real signing secret configured in the deployment secret manager
- real workload session issued
- real MCP server configured
- real tool call observed through the gateway
- resulting evidence independently verified

No production identity, customer, credential, provider, approval, or security outcome is claimed until observed with real evidence.
