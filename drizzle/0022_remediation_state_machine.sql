-- ELITZE canonical remediation state machine. No seed data is inserted.
CREATE TABLE IF NOT EXISTS remediation_workflows (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  finding_id varchar(240) NOT NULL,
  asset_id varchar(240),
  current_state varchar(64) NOT NULL,
  state_version integer NOT NULL DEFAULT 1,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT remediation_workflow_state_canonical CHECK (current_state IN (
    'DETECTED','IDENTIFIED','CORRELATED','TRIAGED','EXPOSURE_VALIDATION',
    'EXPLOITABILITY_VALIDATION','BLAST_ANALYZED','REMEDIATION_PLANNED',
    'SAFETY_CHECKED','APPROVAL_REQUIRED','PREPARED','PREVALIDATED',
    'CANARY_DEPLOY','EXPLOIT_REGRESSION','FUNCTIONAL_VERIFY','SECURITY_VERIFY',
    'VERIFIED_FIX','CONTAINED','ROLLBACK','ROLLED_BACK','BLOCKED','HOLD','MONITORING','REOPENED'
  )),
  UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS remediation_transitions (
  id bigserial PRIMARY KEY,
  remediation_id uuid NOT NULL REFERENCES remediation_workflows(id) ON DELETE CASCADE,
  tenant_id varchar(160) NOT NULL,
  sequence integer NOT NULL,
  previous_state varchar(64) NOT NULL,
  state varchar(64) NOT NULL,
  event varchar(100) NOT NULL,
  allowed boolean NOT NULL,
  reason text NOT NULL,
  actor_type varchar(40) NOT NULL DEFAULT 'system',
  actor_id varchar(200),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT remediation_transition_previous_state_canonical CHECK (previous_state IN (
    'DETECTED','IDENTIFIED','CORRELATED','TRIAGED','EXPOSURE_VALIDATION',
    'EXPLOITABILITY_VALIDATION','BLAST_ANALYZED','REMEDIATION_PLANNED',
    'SAFETY_CHECKED','APPROVAL_REQUIRED','PREPARED','PREVALIDATED',
    'CANARY_DEPLOY','EXPLOIT_REGRESSION','FUNCTIONAL_VERIFY','SECURITY_VERIFY',
    'VERIFIED_FIX','CONTAINED','ROLLBACK','ROLLED_BACK','BLOCKED','HOLD','MONITORING','REOPENED'
  )),
  CONSTRAINT remediation_transition_state_canonical CHECK (state IN (
    'DETECTED','IDENTIFIED','CORRELATED','TRIAGED','EXPOSURE_VALIDATION',
    'EXPLOITABILITY_VALIDATION','BLAST_ANALYZED','REMEDIATION_PLANNED',
    'SAFETY_CHECKED','APPROVAL_REQUIRED','PREPARED','PREVALIDATED',
    'CANARY_DEPLOY','EXPLOIT_REGRESSION','FUNCTIONAL_VERIFY','SECURITY_VERIFY',
    'VERIFIED_FIX','CONTAINED','ROLLBACK','ROLLED_BACK','BLOCKED','HOLD','MONITORING','REOPENED'
  )),
  UNIQUE (remediation_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_remediation_workflows_tenant_state ON remediation_workflows(tenant_id, current_state);
CREATE INDEX IF NOT EXISTS idx_remediation_transitions_tenant_created ON remediation_transitions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_remediation_transitions_workflow ON remediation_transitions(remediation_id, sequence);