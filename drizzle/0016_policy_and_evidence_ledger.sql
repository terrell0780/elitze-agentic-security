CREATE TABLE IF NOT EXISTS security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text NOT NULL DEFAULT '1',
  definition jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, version)
);
CREATE INDEX IF NOT EXISTS security_policies_tenant_active_idx ON security_policies(tenant_id, active, created_at DESC);

ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS decision_ref text;
ALTER TABLE mcp_gateway_decisions
  ADD COLUMN IF NOT EXISTS policy_id uuid REFERENCES security_policies(id) ON DELETE RESTRICT;
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
