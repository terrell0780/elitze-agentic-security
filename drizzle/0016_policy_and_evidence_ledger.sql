-- The tenant-scoped policy table supersedes the legacy, non-tenant-scoped
-- security_policies created in 0001/0003 (serial id + policy_id/effect/scope/rules).
-- That legacy shape is unreferenced by the application and is incompatible with the
-- tenant boundary required by /api/security/policies and /api/mcp-gateway. A bare
-- CREATE TABLE IF NOT EXISTS silently no-ops against it, so drop the legacy table
-- first. Guarded on the legacy signature so this never destroys a migrated table.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'security_policies'
      AND column_name = 'policy_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'security_policies'
      AND column_name = 'tenant_id'
  ) THEN
    DROP TABLE security_policies CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text NOT NULL DEFAULT '1',
  definition jsonb NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, version)
);

-- /api/mcp-gateway orders candidate policies by priority.
ALTER TABLE security_policies
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS security_policies_tenant_active_idx ON security_policies(tenant_id, active, created_at DESC);
CREATE INDEX IF NOT EXISTS security_policies_tenant_priority_idx ON security_policies(tenant_id, active, priority DESC);

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
