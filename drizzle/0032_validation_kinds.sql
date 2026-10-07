ALTER TABLE security_test_requests
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'PENTEST'
    CHECK (kind IN ('PENTEST','RED_TEAM')),
  ADD COLUMN IF NOT EXISTS roe_expires_at timestamptz;

ALTER TABLE security_validation_schedules
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'PENTEST'
    CHECK (kind IN ('PENTEST','RED_TEAM'));

ALTER TABLE red_team_runs
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS security_test_request_id uuid REFERENCES security_test_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS security_test_requests_kind_idx
  ON security_test_requests(tenant_id, kind, created_at DESC);

CREATE INDEX IF NOT EXISTS red_team_runs_tenant_updated_idx
  ON red_team_runs(tenant_id, updated_at DESC);
