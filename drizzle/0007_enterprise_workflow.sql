CREATE TABLE IF NOT EXISTS security_approvals (
  id serial PRIMARY KEY,
  approval_id varchar(120) NOT NULL UNIQUE,
  tenant_id varchar(200) NOT NULL,
  requested_by varchar(200) NOT NULL,
  agent_id varchar(200),
  action varchar(240) NOT NULL,
  target varchar(500) NOT NULL,
  risk varchar(20) NOT NULL,
  rationale text NOT NULL,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(40) NOT NULL DEFAULT 'PENDING',
  decided_by varchar(200),
  decision_reason text,
  expires_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_approvals_tenant_status_idx ON security_approvals (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS security_approvals_expires_idx ON security_approvals (expires_at) WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS security_integration_events (
  id serial PRIMARY KEY,
  tenant_id varchar(200) NOT NULL,
  source varchar(160) NOT NULL,
  event_key varchar(240) NOT NULL,
  event_type varchar(120) NOT NULL,
  payload_hash varchar(64) NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed boolean NOT NULL DEFAULT false,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  CONSTRAINT security_integration_events_source_event_key_uq UNIQUE (source, event_key)
);

CREATE INDEX IF NOT EXISTS security_integration_events_tenant_idx ON security_integration_events (tenant_id, received_at DESC);
CREATE INDEX IF NOT EXISTS security_integration_events_pending_idx ON security_integration_events (processed, received_at);
