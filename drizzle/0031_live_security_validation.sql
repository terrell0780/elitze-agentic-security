-- Live security validation execution, red-team operations, scheduling, findings and event timeline.
-- No synthetic findings or telemetry are inserted.

ALTER TABLE security_test_requests
  ADD COLUMN IF NOT EXISTS execution_mode text NOT NULL DEFAULT 'manual'
    CHECK (execution_mode IN ('manual','automatic')),
  ADD COLUMN IF NOT EXISTS runner_job_id text,
  ADD COLUMN IF NOT EXISTS authorization_ref text,
  ADD COLUMN IF NOT EXISTS roe_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS findings_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_summary jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE red_team_runs
  ADD COLUMN IF NOT EXISTS execution_mode text NOT NULL DEFAULT 'manual'
    CHECK (execution_mode IN ('manual','automatic')),
  ADD COLUMN IF NOT EXISTS runner_job_id text,
  ADD COLUMN IF NOT EXISTS framework text NOT NULL DEFAULT 'ATT&CK',
  ADD COLUMN IF NOT EXISTS authorization_ref text,
  ADD COLUMN IF NOT EXISTS evidence_state text NOT NULL DEFAULT 'UNAVAILABLE'
    CHECK (evidence_state IN ('AVAILABLE','UNAVAILABLE','UNMEASURABLE')),
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS result_summary jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS security_test_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  security_test_request_id uuid REFERENCES security_test_requests(id) ON DELETE CASCADE,
  red_team_run_id integer REFERENCES red_team_runs(id) ON DELETE CASCADE,
  finding_key text NOT NULL,
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  category text NOT NULL,
  target text NOT NULL,
  source text NOT NULL,
  evidence_state text NOT NULL CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACCEPTED','REMEDIATING','RESOLVED','FALSE_POSITIVE')),
  summary text NOT NULL,
  remediation text,
  "references" jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, finding_key)
);

CREATE INDEX IF NOT EXISTS security_test_findings_tenant_idx
  ON security_test_findings(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_test_findings_test_idx
  ON security_test_findings(security_test_request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS security_validation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  security_test_request_id uuid REFERENCES security_test_requests(id) ON DELETE CASCADE,
  red_team_run_id integer REFERENCES red_team_runs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'INFO' CHECK (level IN ('INFO','WARN','ERROR','SUCCESS')),
  event_type text NOT NULL,
  message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_validation_events_tenant_idx
  ON security_validation_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_validation_events_test_idx
  ON security_validation_events(security_test_request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS security_validation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  target text NOT NULL,
  scope text NOT NULL,
  profile text NOT NULL,
  execution_mode text NOT NULL DEFAULT 'automatic'
    CHECK (execution_mode = 'automatic'),
  cadence_minutes integer NOT NULL CHECK (cadence_minutes BETWEEN 5 AND 10080),
  enabled boolean NOT NULL DEFAULT true,
  authorization_ref text NOT NULL,
  roe_expires_at timestamptz,
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_validation_schedules_due_idx
  ON security_validation_schedules(enabled, next_run_at);

CREATE INDEX IF NOT EXISTS security_test_requests_runner_idx
  ON security_test_requests(runner_job_id);

CREATE INDEX IF NOT EXISTS red_team_runs_runner_idx
  ON red_team_runs(runner_job_id);
