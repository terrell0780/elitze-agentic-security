CREATE TABLE IF NOT EXISTS security_test_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  requester_id uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  target text NOT NULL,
  scope text NOT NULL,
  profile text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','RUNNER_NOT_CONFIGURED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  evidence_state text NOT NULL DEFAULT 'UNAVAILABLE' CHECK (evidence_state IN ('AVAILABLE','UNAVAILABLE','UNMEASURABLE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS security_test_requests_tenant_idx
  ON security_test_requests(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS security_test_requests_requester_idx
  ON security_test_requests(tenant_id, requester_id, created_at DESC);
