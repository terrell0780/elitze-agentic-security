ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS definition jsonb DEFAULT '{}'::jsonb;
ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE security_policies
  ALTER COLUMN policy_id SET DEFAULT ('pol_' || gen_random_uuid()::text);
ALTER TABLE security_policies
  ALTER COLUMN effect SET DEFAULT 'ALLOW';
ALTER TABLE security_policies
  ALTER COLUMN scope SET DEFAULT '*';
ALTER TABLE security_policies
  ALTER COLUMN rules SET DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS security_policies_tenant_name_version_uq
  ON security_policies(tenant_id, name, version);
CREATE INDEX IF NOT EXISTS security_policies_tenant_active_idx ON security_policies(tenant_id, active, created_at DESC);

ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS decision_ref text;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS policy_id integer REFERENCES security_policies(id) ON DELETE RESTRICT;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS evidence_source text NOT NULL DEFAULT 'mcp-gateway';
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS evidence_state text NOT NULL DEFAULT 'OBSERVED' CHECK (evidence_state IN ('OBSERVED','INFERRED','SIMULATED','UNKNOWN','UNMEASURABLE'));
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS source_ref text;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS freshness_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS observed_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS previous_evidence_hash text;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS evidence_event jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS evidence_signature text;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED','VERIFIED','FAILED'));
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

UPDATE mcp_gateway_decisions
SET decision_ref = 'dec_' || id::text
WHERE decision_ref IS NULL;

ALTER TABLE mcp_gateway_decisions
  ALTER COLUMN decision_ref SET DEFAULT ('dec_' || gen_random_uuid()::text);
CREATE UNIQUE INDEX IF NOT EXISTS mcp_gateway_decisions_decision_ref_uq ON mcp_gateway_decisions(decision_ref);
CREATE INDEX IF NOT EXISTS mcp_gateway_decisions_policy_idx ON mcp_gateway_decisions(tenant_id, policy_id, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_mcp_gateway_decision_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'mcp_gateway_decisions_are_append_only';
END;
$$;

DROP TRIGGER IF EXISTS mcp_gateway_decisions_append_only ON mcp_gateway_decisions;
CREATE TRIGGER mcp_gateway_decisions_append_only
BEFORE UPDATE OR DELETE ON mcp_gateway_decisions
FOR EACH ROW EXECUTE FUNCTION prevent_mcp_gateway_decision_mutation();
