CREATE TABLE IF NOT EXISTS mcp_tool_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  gateway_server_id uuid NOT NULL REFERENCES mcp_gateway_servers(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  description_hash text NOT NULL,
  description text NOT NULL,
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_ref text NOT NULL,
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  first_observed_at timestamptz NOT NULL DEFAULT now(),
  last_observed_at timestamptz NOT NULL DEFAULT now(),
  previous_description_hash text,
  changed_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, gateway_server_id, tool_name)
);
CREATE INDEX IF NOT EXISTS mcp_tool_inventory_server_idx ON mcp_tool_inventory(tenant_id, gateway_server_id, active);
CREATE INDEX IF NOT EXISTS mcp_tool_inventory_changed_idx ON mcp_tool_inventory(tenant_id, changed_at DESC);
