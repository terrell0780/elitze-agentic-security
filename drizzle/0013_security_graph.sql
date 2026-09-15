CREATE TABLE IF NOT EXISTS security_graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (node_type IN (
    'HUMAN_IDENTITY','AGENT_IDENTITY','SERVICE_ACCOUNT','MODEL','PROMPT_CONFIG',
    'MCP_CLIENT','MCP_SERVER','TOOL','API_CREDENTIAL','CLOUD_ROLE','DATA_STORE',
    'DEPLOYMENT_ENVIRONMENT','APPROVAL_AUTHORITY','POLICY','DECISION','RUNTIME_ACTION',
    'EVIDENCE_RECORD','VERIFICATION_RECORD'
  )),
  subject_key text NOT NULL,
  display_name text NOT NULL,
  source text NOT NULL,
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  source_ref text,
  observed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, node_type, subject_key)
);
CREATE INDEX IF NOT EXISTS security_graph_nodes_tenant_type_idx ON security_graph_nodes(tenant_id, node_type, active);
CREATE INDEX IF NOT EXISTS security_graph_nodes_subject_idx ON security_graph_nodes(tenant_id, subject_key);

CREATE TABLE IF NOT EXISTS security_graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  from_node_id uuid NOT NULL REFERENCES security_graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES security_graph_nodes(id) ON DELETE CASCADE,
  relation text NOT NULL CHECK (relation IN (
    'AUTHORIZES','DELEGATES','ASSUMES','USES','INVOKES','ROUTES_TO','CAN_REACH',
    'READS','WRITES','EXECUTES','DEPLOYED_IN','CONFIGURED_BY','GOVERNS','DECIDED_BY',
    'RESULTED_IN','SUPPORTED_BY','VERIFIED_BY','PROVES','DEPENDS_ON'
  )),
  access_mode text CHECK (access_mode IN ('READ','WRITE','EXECUTE','ADMIN')),
  policy_effect text CHECK (policy_effect IN ('ALLOW','DENY','REVIEW','CONSTRAIN')),
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  source text NOT NULL,
  source_ref text,
  observed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, from_node_id, to_node_id, relation, access_mode, policy_effect)
);
CREATE INDEX IF NOT EXISTS security_graph_edges_from_idx ON security_graph_edges(tenant_id, from_node_id, active);
CREATE INDEX IF NOT EXISTS security_graph_edges_to_idx ON security_graph_edges(tenant_id, to_node_id, active);
CREATE INDEX IF NOT EXISTS security_graph_edges_relation_idx ON security_graph_edges(tenant_id, relation, active);

CREATE TABLE IF NOT EXISTS security_graph_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  node_id uuid REFERENCES security_graph_nodes(id) ON DELETE CASCADE,
  edge_id uuid REFERENCES security_graph_edges(id) ON DELETE CASCADE,
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('OBSERVATION','DECISION','EXECUTION','RETEST','VERIFICATION')),
  source text NOT NULL,
  source_ref text,
  observed_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((node_id IS NOT NULL) OR (edge_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS security_graph_evidence_node_idx ON security_graph_evidence(tenant_id, node_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_graph_evidence_edge_idx ON security_graph_evidence(tenant_id, edge_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS security_graph_evidence_node_hash_idx ON security_graph_evidence(tenant_id, node_id, content_hash) WHERE node_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS security_graph_evidence_edge_hash_idx ON security_graph_evidence(tenant_id, edge_id, content_hash) WHERE edge_id IS NOT NULL;
