CREATE TABLE IF NOT EXISTS security_fabric_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  integration_state text NOT NULL DEFAULT 'IMPLEMENTED' CHECK (integration_state IN ('IMPLEMENTED','INTEGRATED','PLANNED','BLOCKED')),
  health_state text NOT NULL DEFAULT 'NOT_CONFIGURED' CHECK (health_state IN ('CONNECTED','NOT_CONFIGURED','UNAVAILABLE','ERROR')),
  configuration_ref text,
  last_observed_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, connector_id)
);

CREATE TABLE IF NOT EXISTS security_fabric_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  event_type text NOT NULL,
  subject_key text,
  evidence_state text NOT NULL DEFAULT 'OBSERVED' CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  severity text CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  observed_at timestamptz NOT NULL DEFAULT now(),
  source_ref text,
  content_hash text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, connector_id, content_hash)
);

CREATE INDEX IF NOT EXISTS security_fabric_events_subject_idx
  ON security_fabric_events(tenant_id, subject_key, observed_at DESC);

CREATE INDEX IF NOT EXISTS security_fabric_events_connector_idx
  ON security_fabric_events(tenant_id, connector_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS autonomous_analyst_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  trigger text NOT NULL CHECK (trigger IN ('MANUAL','SCHEDULED','EVENT')),
  status text NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','COMPLETED','FAILED','BLOCKED')),
  evidence_state text NOT NULL DEFAULT 'UNMEASURABLE' CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS autonomous_analyst_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES autonomous_analyst_runs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  confidence text NOT NULL CHECK (confidence IN ('LOW','MEDIUM','HIGH')),
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  subject_key text,
  technique_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  supporting_event_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  gaps text[] NOT NULL DEFAULT ARRAY[]::text[],
  proposed_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_state text NOT NULL DEFAULT 'APPROVAL_REQUIRED' CHECK (action_state IN ('NOT_EXECUTED','APPROVAL_REQUIRED','EXECUTED','BLOCKED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS autonomous_analyst_findings_tenant_idx
  ON autonomous_analyst_findings(tenant_id, created_at DESC);
