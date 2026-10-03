ALTER TABLE workload_sessions
  ADD COLUMN IF NOT EXISTS gateway_server_id uuid REFERENCES mcp_gateway_servers(id) ON DELETE RESTRICT;

ALTER TABLE workload_delegations
  ADD COLUMN IF NOT EXISTS tool_name text;

CREATE INDEX IF NOT EXISTS workload_sessions_gateway_server_idx
  ON workload_sessions(tenant_id, gateway_server_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS workload_delegations_tool_idx
  ON workload_delegations(tenant_id, workload_session_id, tool_name);

CREATE TABLE IF NOT EXISTS mcp_gateway_request_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  workload_session_id uuid NOT NULL REFERENCES workload_sessions(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  token_jti text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  UNIQUE (tenant_id, workload_session_id, request_id)
);

CREATE INDEX IF NOT EXISTS mcp_gateway_request_nonces_expiry_idx
  ON mcp_gateway_request_nonces(expires_at);

CREATE TABLE IF NOT EXISTS mcp_gateway_rate_limits (
  bucket text PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  workload_session_id uuid NOT NULL REFERENCES workload_sessions(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mcp_gateway_rate_limits_tenant_idx
  ON mcp_gateway_rate_limits(tenant_id, window_started_at DESC);
