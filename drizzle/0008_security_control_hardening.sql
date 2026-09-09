CREATE TABLE IF NOT EXISTS audit_ledger_events (
  id uuid PRIMARY KEY,
  tenant_id varchar(200) NOT NULL,
  sequence bigint NOT NULL,
  event_type varchar(100) NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  previous_hash varchar(64),
  hash varchar(64) NOT NULL UNIQUE,
  CONSTRAINT audit_ledger_tenant_sequence_unique UNIQUE (tenant_id, sequence),
  CONSTRAINT audit_ledger_previous_hash_shape CHECK (previous_hash IS NULL OR length(previous_hash) = 64),
  CONSTRAINT audit_ledger_hash_shape CHECK (length(hash) = 64)
);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_tenant_sequence ON audit_ledger_events(tenant_id, sequence DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_occurred_at ON audit_ledger_events(occurred_at DESC);
CREATE OR REPLACE FUNCTION prevent_audit_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ELITZE audit ledger is append-only'; END;
$$;
DROP TRIGGER IF EXISTS audit_ledger_no_update ON audit_ledger_events;
CREATE TRIGGER audit_ledger_no_update BEFORE UPDATE OR DELETE ON audit_ledger_events FOR EACH ROW EXECUTE FUNCTION prevent_audit_ledger_mutation();

CREATE TABLE IF NOT EXISTS containment_actions (
  id uuid PRIMARY KEY,
  tenant_id varchar(200) NOT NULL,
  scope varchar(200) NOT NULL,
  requested_by varchar(200) NOT NULL,
  reason text NOT NULL,
  idempotency_key varchar(200) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'REQUESTED',
  executor_status varchar(40) NOT NULL DEFAULT 'NOT_ATTEMPTED',
  requested_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  verified_at timestamptz,
  result jsonb,
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_containment_actions_tenant_status ON containment_actions(tenant_id, status, requested_at DESC);
