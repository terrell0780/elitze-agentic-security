CREATE TABLE IF NOT EXISTS agent_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  workflow_key varchar(200) NOT NULL,
  name varchar(300) NOT NULL,
  description text NOT NULL,
  trigger_kind varchar(30) NOT NULL CHECK (trigger_kind IN ('MANUAL','SCHEDULED','EVENT')),
  schedule text,
  timezone varchar(120),
  enabled boolean NOT NULL DEFAULT false,
  autonomy_mode varchar(30) NOT NULL DEFAULT 'APPROVAL_GATED' CHECK (autonomy_mode IN ('READ_ONLY','APPROVAL_GATED','AUTONOMOUS')),
  allowed_skill_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  allowed_channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  max_delegation_depth integer NOT NULL DEFAULT 1 CHECK (max_delegation_depth BETWEEN 0 AND 8),
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, workflow_key)
);

CREATE TABLE IF NOT EXISTS agent_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  trigger_kind varchar(30) NOT NULL CHECK (trigger_kind IN ('MANUAL','SCHEDULED','EVENT')),
  status varchar(40) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','RUNNING','WAITING_APPROVAL','COMPLETED','FAILED','BLOCKED')),
  evidence_state varchar(30) NOT NULL DEFAULT 'UNMEASURABLE' CHECK (evidence_state IN ('OBSERVED','INFERRED','UNKNOWN','UNMEASURABLE')),
  objective text NOT NULL,
  requested_action text,
  approval_id varchar(120),
  parent_run_id uuid REFERENCES agent_workflow_runs(id) ON DELETE SET NULL,
  current_step integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  retest_status varchar(30) NOT NULL DEFAULT 'NOT_RUN' CHECK (retest_status IN ('NOT_RUN','PENDING','PASSED','FAILED','UNMEASURABLE')),
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  memory_key varchar(240) NOT NULL,
  content text NOT NULL,
  content_hash varchar(64) NOT NULL,
  trust_state varchar(30) NOT NULL DEFAULT 'UNTRUSTED' CHECK (trust_state IN ('UNTRUSTED','VERIFIED','STALE','REVOKED')),
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  evidence_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, agent_id, memory_key)
);

CREATE TABLE IF NOT EXISTS agent_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  source_agent_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  target_agent_id uuid NOT NULL REFERENCES agent_identities(id) ON DELETE RESTRICT,
  workflow_id uuid REFERENCES agent_workflows(id) ON DELETE SET NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  purpose text NOT NULL,
  max_depth integer NOT NULL DEFAULT 1 CHECK (max_depth BETWEEN 1 AND 8),
  expires_at timestamptz NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED','EXPIRED')),
  created_by uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
  name varchar(240) NOT NULL,
  schedule text NOT NULL,
  timezone varchar(120) NOT NULL DEFAULT 'UTC',
  enabled boolean NOT NULL DEFAULT false,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_run_id uuid REFERENCES agent_workflow_runs(id) ON DELETE SET NULL,
  last_error text,
  created_by uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS agent_workflows_tenant_idx
  ON agent_workflows(tenant_id, enabled, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_workflow_runs_tenant_idx
  ON agent_workflow_runs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_workflow_runs_workflow_idx
  ON agent_workflow_runs(workflow_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_memory_records_tenant_idx
  ON agent_memory_records(tenant_id, agent_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_delegations_tenant_idx
  ON agent_delegations(tenant_id, source_agent_id, status, expires_at);

CREATE INDEX IF NOT EXISTS agent_routines_due_idx
  ON agent_routines(tenant_id, enabled, next_run_at);
