CREATE TABLE IF NOT EXISTS agent_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('AGENT','MODEL','MCP_SERVER','TOOL')),
  identity_fingerprint text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, identity_fingerprint)
);
CREATE INDEX IF NOT EXISTS agent_identities_tenant_idx ON agent_identities(tenant_id, active, kind);

CREATE TABLE IF NOT EXISTS agent_reachability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('TOOL','MCP_SERVER','API','SECRET','DATA')),
  resource_id text NOT NULL,
  resource_name text NOT NULL,
  access_mode text NOT NULL CHECK (access_mode IN ('READ','WRITE','EXECUTE','ADMIN')),
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  source text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, agent_id, resource_type, resource_id, access_mode)
);
CREATE INDEX IF NOT EXISTS agent_reachability_agent_idx ON agent_reachability(tenant_id, agent_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS runtime_action_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  mcp_server_id uuid REFERENCES agent_identities(id) ON DELETE RESTRICT,
  tool_id uuid REFERENCES agent_identities(id) ON DELETE RESTRICT,
  action text NOT NULL,
  data_classification text CHECK (data_classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
  decision text NOT NULL CHECK (decision IN ('APPROVE','REVIEW','QUEUE','BLOCK')),
  approval_required boolean NOT NULL DEFAULT false,
  constraint_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_status text NOT NULL DEFAULT 'NOT_EXECUTED' CHECK (result_status IN ('NOT_EXECUTED','EXECUTED','DENIED','FAILED','CONSTRAINED')),
  result_summary text,
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  audit_event_id uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  retest_status text NOT NULL DEFAULT 'NOT_RUN' CHECK (retest_status IN ('NOT_RUN','PENDING','PASSED','FAILED','UNMEASURABLE'))
);
CREATE INDEX IF NOT EXISTS runtime_action_requests_tenant_idx ON runtime_action_requests(tenant_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS runtime_action_requests_agent_idx ON runtime_action_requests(agent_id, requested_at DESC);
