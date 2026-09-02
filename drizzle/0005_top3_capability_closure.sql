-- ELITZE enterprise capability closure.
-- Data-model only: no synthetic findings, telemetry, identities, or compliance results are inserted.
-- Connectors and customer-controlled collectors must populate these tables with verified data.

CREATE TABLE IF NOT EXISTS endpoint_assets (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  asset_key varchar(300) NOT NULL,
  hostname varchar(240),
  os varchar(120),
  agent_status varchar(60),
  risk_score real,
  last_seen_at timestamptz,
  posture jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, asset_key)
);

CREATE TABLE IF NOT EXISTS endpoint_events (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  event_id varchar(300) NOT NULL,
  event_time timestamptz NOT NULL,
  asset_key varchar(300),
  event_type varchar(160) NOT NULL,
  process_name varchar(300),
  user_id varchar(240),
  command_line text,
  verdict varchar(80),
  normalized jsonb NOT NULL,
  UNIQUE (tenant_id, event_id)
);

CREATE TABLE IF NOT EXISTS cloud_findings (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  provider varchar(80) NOT NULL,
  account_id varchar(240) NOT NULL,
  resource_id varchar(400) NOT NULL,
  control_id varchar(200) NOT NULL,
  finding_type varchar(120) NOT NULL,
  severity varchar(30) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'open',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz
);

CREATE TABLE IF NOT EXISTS saas_assets (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  app_key varchar(300) NOT NULL,
  provider varchar(160),
  owner varchar(240),
  risk_score real,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  posture jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at timestamptz,
  UNIQUE (tenant_id, app_key)
);

CREATE TABLE IF NOT EXISTS identity_principals (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  principal_key varchar(300) NOT NULL,
  principal_type varchar(80) NOT NULL,
  provider varchar(120),
  privilege_level varchar(80),
  risk_score real,
  authentication_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_seen_at timestamptz,
  UNIQUE (tenant_id, principal_key)
);

CREATE TABLE IF NOT EXISTS data_findings (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  data_asset_key varchar(300) NOT NULL,
  finding_type varchar(120) NOT NULL,
  classification varchar(100),
  severity varchar(30),
  exposure varchar(80),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz
);

CREATE TABLE IF NOT EXISTS network_flows (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  flow_id varchar(300) NOT NULL,
  event_time timestamptz NOT NULL,
  src_asset varchar(300),
  dst_asset varchar(300),
  src_identity varchar(240),
  protocol varchar(60),
  action varchar(80),
  bytes bigint,
  normalized jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, flow_id)
);

CREATE TABLE IF NOT EXISTS threat_intelligence (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160),
  indicator_type varchar(80) NOT NULL,
  indicator varchar(500) NOT NULL,
  source varchar(200) NOT NULL,
  confidence real,
  severity varchar(30),
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  relationships jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (tenant_id, indicator_type, indicator, source)
);

CREATE TABLE IF NOT EXISTS hunting_queries (
  id serial PRIMARY KEY,
  tenant_id varchar(160),
  query_id varchar(200) NOT NULL UNIQUE,
  name varchar(240) NOT NULL,
  language varchar(60) NOT NULL,
  definition text NOT NULL,
  schedule varchar(120),
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hunting_runs (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  query_id varchar(200) NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  result_count integer,
  result_ref varchar(500),
  status varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS software_artifacts (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  artifact_key varchar(400) NOT NULL,
  artifact_type varchar(100) NOT NULL,
  digest varchar(200),
  supplier varchar(240),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  scan_state varchar(60) NOT NULL DEFAULT 'not_scanned',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (tenant_id, artifact_key)
);

CREATE TABLE IF NOT EXISTS compliance_controls (
  id serial PRIMARY KEY,
  tenant_id varchar(160),
  framework varchar(160) NOT NULL,
  control_id varchar(160) NOT NULL,
  title varchar(300) NOT NULL,
  requirement text,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  state varchar(50) NOT NULL DEFAULT 'unknown',
  assessed_at timestamptz,
  UNIQUE (tenant_id, framework, control_id)
);

CREATE TABLE IF NOT EXISTS integration_health (
  id serial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  integration_key varchar(200) NOT NULL,
  provider varchar(160) NOT NULL,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  records_ingested bigint NOT NULL DEFAULT 0,
  state varchar(60) NOT NULL DEFAULT 'not_configured',
  error text,
  UNIQUE (tenant_id, integration_key)
);

CREATE INDEX IF NOT EXISTS idx_endpoint_events_time ON endpoint_events(tenant_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_cloud_findings_status ON cloud_findings(tenant_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_identity_principals_risk ON identity_principals(tenant_id, risk_score);
CREATE INDEX IF NOT EXISTS idx_data_findings_severity ON data_findings(tenant_id, severity);
CREATE INDEX IF NOT EXISTS idx_network_flows_time ON network_flows(tenant_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_threat_intel_indicator ON threat_intelligence(indicator);
CREATE INDEX IF NOT EXISTS idx_hunting_runs_time ON hunting_runs(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_state ON compliance_controls(tenant_id, state);
