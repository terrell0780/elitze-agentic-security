CREATE TABLE IF NOT EXISTS mcp_gateway_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  agent_identity_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE CASCADE,
  name text NOT NULL,
  endpoint_url text NOT NULL,
  credential_env text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS mcp_gateway_servers_tenant_idx ON mcp_gateway_servers(tenant_id, active);

CREATE TABLE IF NOT EXISTS mcp_gateway_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  agent_identity_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  gateway_server_id uuid NOT NULL REFERENCES mcp_gateway_servers(id) ON DELETE RESTRICT,
  tool_name text NOT NULL,
  action text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('ALLOW','DENY','REQUIRE_APPROVAL','ALLOW_WITH_CONSTRAINTS')),
  policy_version text NOT NULL,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_reference text,
  upstream_status integer,
  upstream_result_hash text,
  evidence_hash text NOT NULL,
  evidence_signature text NOT NULL,
  previous_evidence_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, request_id)
);
CREATE INDEX IF NOT EXISTS mcp_gateway_decisions_tenant_idx ON mcp_gateway_decisions(tenant_id, created_at DESC);
