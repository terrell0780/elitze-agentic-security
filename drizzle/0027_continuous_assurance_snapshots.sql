CREATE TABLE IF NOT EXISTS security_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  snapshot_version varchar(40) NOT NULL DEFAULT '2026-10-02',
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  state jsonb NOT NULL,
  content_hash varchar(64) NOT NULL,
  previous_hash varchar(64),
  source varchar(120) NOT NULL DEFAULT 'ELITZE Daily Snapshot',
  UNIQUE (tenant_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS security_daily_snapshots_tenant_idx
  ON security_daily_snapshots(tenant_id, snapshot_date DESC);

CREATE OR REPLACE FUNCTION deny_security_daily_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'security_daily_snapshots_are_append_only';
END;
$$;

DROP TRIGGER IF EXISTS security_daily_snapshots_no_update ON security_daily_snapshots;
CREATE TRIGGER security_daily_snapshots_no_update
BEFORE UPDATE ON security_daily_snapshots
FOR EACH ROW EXECUTE FUNCTION deny_security_daily_snapshot_mutation();

DROP TRIGGER IF EXISTS security_daily_snapshots_no_delete ON security_daily_snapshots;
CREATE TRIGGER security_daily_snapshots_no_delete
BEFORE DELETE ON security_daily_snapshots
FOR EACH ROW EXECUTE FUNCTION deny_security_daily_snapshot_mutation();

ALTER TABLE security_test_requests
  ADD COLUMN IF NOT EXISTS baseline_snapshot_id uuid REFERENCES security_daily_snapshots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS security_test_requests_snapshot_idx
  ON security_test_requests(baseline_snapshot_id);
