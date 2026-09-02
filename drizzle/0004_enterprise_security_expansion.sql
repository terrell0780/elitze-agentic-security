-- ELITZE enterprise security expansion.
-- Schema only: no synthetic telemetry or findings are inserted.
-- Integrations populate these tables with verified customer/environment data.

CREATE TABLE IF NOT EXISTS security_assets (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  asset_key varchar(240) NOT NULL,
  asset_type varchar(80) NOT NULL,
  provider varchar(120),
  environment varchar(80),
  owner varchar(160),
  criticality varchar(30) NOT NULL DEFAULT 'unknown',
  internet_exposed boolean,
  status varchar(40) NOT NULL DEFAULT 'active',
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, asset_key)
);

CREATE TABLE IF NOT EXISTS security_telemetry (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  event_id varchar(240) NOT NULL,
  event_time timestamptz NOT NULL,
  source_type varchar(80) NOT NULL,
  source_id varchar(200),
  event_type varchar(120) NOT NULL,
  actor_id varchar(200),
  asset_key varchar(240),
  severity varchar(30),
  raw_ref varchar(500),
  normalized jsonb NOT NULL,
  UNIQUE (tenant_id, event_id)
);

CREATE TABLE IF NOT EXISTS detection_rules (
  id serial PRIMARY KEY,
  tenant_id varchar(160),
  rule_id varchar(160) NOT NULL UNIQUE,
  name varchar(240) NOT NULL,
  language varchar(40) NOT NULL,
  definition text NOT NULL,
  severity varchar(30) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  version varchar(40) NOT NULL DEFAULT '1',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  incident_key varchar(240) NOT NULL,
  title varchar(300) NOT NULL,
  severity varchar(30) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'open',
  confidence real,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  attack_story jsonb NOT NULL DEFAULT '{}'::jsonb,
  entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_to varchar(160),
  UNIQUE (tenant_id, incident_key)
);

CREATE TABLE IF NOT EXISTS response_playbooks (
  id serial PRIMARY KEY,
  tenant_id varchar(160),
  playbook_id varchar(160) NOT NULL UNIQUE,
  name varchar(240) NOT NULL,
  trigger_definition jsonb NOT NULL,
  steps jsonb NOT NULL,
  approval_mode varchar(40) NOT NULL DEFAULT 'human_approval',
  rollback_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  version varchar(40) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS response_actions (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  incident_id integer REFERENCES incidents(id),
  action_type varchar(120) NOT NULL,
  target varchar(300) NOT NULL,
  requested_by varchar(160),
  approved_by varchar(160),
  status varchar(40) NOT NULL DEFAULT 'pending',
  reason text,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  rolled_back_at timestamptz
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  asset_id integer REFERENCES security_assets(id),
  cve_id varchar(40),
  source varchar(80) NOT NULL,
  cvss real,
  epss real,
  kev boolean NOT NULL DEFAULT false,
  exploit_available boolean,
  business_criticality varchar(30),
  exposure_score real,
  status varchar(40) NOT NULL DEFAULT 'open',
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  remediation_due_at timestamptz,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS cloud_resources (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  provider varchar(80) NOT NULL,
  account_id varchar(200) NOT NULL,
  resource_id varchar(300) NOT NULL,
  resource_type varchar(120) NOT NULL,
  region varchar(120),
  posture jsonb NOT NULL DEFAULT '{}'::jsonb,
  runtime jsonb NOT NULL DEFAULT '{}'::jsonb,
  identity_bindings jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (tenant_id, provider, account_id, resource_id)
);

CREATE TABLE IF NOT EXISTS data_assets (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  asset_key varchar(300) NOT NULL,
  data_classification varchar(80),
  owner varchar(160),
  location varchar(300),
  access_graph jsonb NOT NULL DEFAULT '{}'::jsonb,
  exposure_risk real,
  last_classified_at timestamptz,
  UNIQUE (tenant_id, asset_key)
);

CREATE TABLE IF NOT EXISTS identity_risk (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  principal_id varchar(240) NOT NULL,
  principal_type varchar(60) NOT NULL,
  risk_score real,
  privilege_level varchar(40),
  authentication_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  recent_anomalies jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_evaluated_at timestamptz,
  UNIQUE (tenant_id, principal_id)
);

CREATE TABLE IF NOT EXISTS ai_systems (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  system_key varchar(240) NOT NULL,
  system_type varchar(80) NOT NULL,
  provider varchar(160),
  model varchar(200),
  owner varchar(160),
  environment varchar(80),
  data_access jsonb NOT NULL DEFAULT '[]'::jsonb,
  tool_access jsonb NOT NULL DEFAULT '[]'::jsonb,
  identity_id varchar(240),
  posture jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, system_key)
);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  server_key varchar(240) NOT NULL,
  name varchar(200) NOT NULL,
  endpoint varchar(500),
  owner varchar(160),
  trust_state varchar(40) NOT NULL DEFAULT 'unknown',
  allowed_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  identity_id varchar(240),
  last_seen_at timestamptz,
  UNIQUE (tenant_id, server_key)
);

CREATE TABLE IF NOT EXISTS a2a_relationships (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  source_agent varchar(240) NOT NULL,
  target_agent varchar(240) NOT NULL,
  delegation_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_depth integer NOT NULL DEFAULT 1,
  trust_state varchar(40) NOT NULL DEFAULT 'unknown',
  last_verified_at timestamptz,
  UNIQUE (tenant_id, source_agent, target_agent)
);

CREATE TABLE IF NOT EXISTS email_security_events (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  message_key varchar(300) NOT NULL,
  event_time timestamptz NOT NULL,
  sender varchar(300),
  recipient varchar(300),
  verdict varchar(60),
  phishing_score real,
  malicious_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  malicious_attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_instruction_risk real
);

CREATE TABLE IF NOT EXISTS network_security_events (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  event_time timestamptz NOT NULL,
  src varchar(300),
  dst varchar(300),
  protocol varchar(40),
  action varchar(60),
  policy_id varchar(160),
  bytes bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS software_components (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  component_key varchar(300) NOT NULL,
  name varchar(200) NOT NULL,
  version varchar(120),
  ecosystem varchar(100),
  supplier varchar(200),
  source_ref varchar(500),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  vulnerabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (tenant_id, component_key)
);

CREATE TABLE IF NOT EXISTS security_integrations (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  integration_key varchar(200) NOT NULL,
  category varchar(100) NOT NULL,
  provider varchar(160) NOT NULL,
  mode varchar(60) NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(40) NOT NULL DEFAULT 'not_configured',
  last_sync_at timestamptz,
  last_error text,
  UNIQUE (tenant_id, integration_key)
);

CREATE INDEX IF NOT EXISTS idx_security_telemetry_tenant_time ON security_telemetry(tenant_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_status ON incidents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_tenant_status ON vulnerabilities(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_response_actions_status ON response_actions(status);
CREATE INDEX IF NOT EXISTS idx_identity_risk_score ON identity_risk(risk_score);
CREATE INDEX IF NOT EXISTS idx_ai_systems_tenant ON ai_systems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_events_time ON network_security_events(event_time DESC);
