-- ELITZE REO persistence. No synthetic content, scores, evidence, or audit records are inserted.
CREATE TABLE IF NOT EXISTS reo_content (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  content_id varchar(240) NOT NULL,
  author_id varchar(240) NOT NULL,
  model_id varchar(240),
  model_provider varchar(160),
  content_hash varchar(64) NOT NULL,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  uniqueness_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision varchar(20) NOT NULL,
  trust_score real,
  semantic_cluster_id varchar(240),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, content_id)
);

CREATE TABLE IF NOT EXISTS reo_evidence (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  content_id varchar(240) NOT NULL,
  evidence_id varchar(240) NOT NULL,
  evidence_hash varchar(64) NOT NULL,
  verified boolean NOT NULL,
  source_ref varchar(500),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, content_id, evidence_id)
);

CREATE TABLE IF NOT EXISTS reo_audit_events (
  id bigserial PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  content_id varchar(240) NOT NULL,
  decision varchar(20) NOT NULL,
  event_type varchar(100) NOT NULL,
  actor_id varchar(240),
  policy_version varchar(80),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_event_hash varchar(64),
  event_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reo_content_decision ON reo_content(tenant_id, decision, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reo_content_cluster ON reo_content(tenant_id, semantic_cluster_id);
CREATE INDEX IF NOT EXISTS idx_reo_evidence_content ON reo_evidence(tenant_id, content_id);
CREATE INDEX IF NOT EXISTS idx_reo_audit_content ON reo_audit_events(tenant_id, content_id, created_at DESC);
