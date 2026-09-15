CREATE TABLE IF NOT EXISTS workload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  human_owner_id text NOT NULL,
  application_id text NOT NULL,
  agent_identity_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  delegation_source text NOT NULL,
  purpose text NOT NULL,
  requested_capability text NOT NULL,
  approval_authority_id text,
  token_hash text NOT NULL UNIQUE,
  token_kid text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS workload_sessions_tenant_idx ON workload_sessions(tenant_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS workload_sessions_agent_idx ON workload_sessions(agent_identity_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS workload_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  workload_session_id uuid NOT NULL REFERENCES workload_sessions(id) ON DELETE CASCADE,
  human_owner_id text NOT NULL,
  delegation_source text NOT NULL,
  purpose text NOT NULL,
  requested_capability text NOT NULL,
  tool_id uuid REFERENCES agent_identities(id) ON DELETE RESTRICT,
  resource_type text,
  resource_id text,
  credential_ref text,
  approval_authority_id text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS workload_delegations_session_idx ON workload_delegations(tenant_id, workload_session_id, created_at DESC);

ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS workload_session_id uuid REFERENCES workload_sessions(id) ON DELETE RESTRICT;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS human_owner_id text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS application_id text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS delegation_source text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS purpose text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS requested_capability text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS resource_type text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS resource_id text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS credential_ref text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS approval_authority_id text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE INDEX IF NOT EXISTS mcp_gateway_decisions_session_idx ON mcp_gateway_decisions(tenant_id, workload_session_id, created_at DESC);
