-- ELITZE agent skill security model.
-- Schema only: never inserts synthetic telemetry, findings, identities, hashes, or scan results.

CREATE TABLE IF NOT EXISTS agent_skills (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  skill_key varchar(400) NOT NULL,
  name varchar(240),
  source_reference text,
  source_type varchar(80),
  version varchar(200),
  content_digest varchar(200),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  admission_state varchar(60) NOT NULL DEFAULT 'unknown',
  last_scan_state varchar(60) NOT NULL DEFAULT 'not_scanned',
  last_scan_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, skill_key)
);

CREATE TABLE IF NOT EXISTS agent_skill_scans (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  skill_key varchar(400) NOT NULL,
  scanner varchar(120) NOT NULL,
  scanner_version varchar(120),
  scan_mode varchar(80) NOT NULL,
  source_reference text,
  started_at timestamptz,
  completed_at timestamptz,
  risk_score real,
  severity varchar(40),
  recommendation varchar(120),
  safe_to_install boolean,
  scan_state varchar(60) NOT NULL DEFAULT 'unknown',
  result_reference text,
  evidence_reference text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_skill_decisions (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  skill_key varchar(400) NOT NULL,
  decision varchar(60) NOT NULL,
  policy_id varchar(200),
  reo_id varchar(200),
  reason text,
  evidence_reference text,
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_skill_relationships (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  skill_key varchar(400) NOT NULL,
  target_type varchar(80) NOT NULL,
  target_key varchar(400) NOT NULL,
  relationship_type varchar(120) NOT NULL,
  truth_state varchar(40) NOT NULL DEFAULT 'OBSERVED',
  observed_at timestamptz,
  source_reference text,
  evidence_reference text,
  UNIQUE (tenant_id, skill_key, target_type, target_key, relationship_type)
);

CREATE TABLE IF NOT EXISTS agent_skill_evidence (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  skill_key varchar(400) NOT NULL,
  evidence_type varchar(120) NOT NULL,
  source_reference text,
  content_reference text,
  content_digest varchar(200),
  captured_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_skills_admission ON agent_skills(tenant_id, admission_state);
CREATE INDEX IF NOT EXISTS idx_agent_skill_scans_skill ON agent_skill_scans(tenant_id, skill_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_skill_decisions_skill ON agent_skill_decisions(tenant_id, skill_key, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_skill_relationships_target ON agent_skill_relationships(tenant_id, target_type, target_key);
CREATE INDEX IF NOT EXISTS idx_agent_skill_evidence_skill ON agent_skill_evidence(tenant_id, skill_key, captured_at DESC);
