ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS decision_ref text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS policy_id text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS evidence_source text NOT NULL DEFAULT 'mcp-gateway';
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS evidence_state text NOT NULL DEFAULT 'OBSERVED' CHECK (evidence_state IN ('OBSERVED','INFERRED','SIMULATED','UNKNOWN','UNMEASURABLE'));
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS source_ref text;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS freshness_at timestamptz;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS observed_at timestamptz;
ALTER TABLE mcp_gateway_decisions ADD COLUMN IF NOT EXISTS evidence_event jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE mcp_gateway_decisions SET decision_ref = COALESCE(decision_ref, request_id), observed_at = COALESCE(observed_at, created_at), freshness_at = COALESCE(freshness_at, created_at);
ALTER TABLE mcp_gateway_decisions ALTER COLUMN decision_ref SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mcp_gateway_decisions_ref_idx ON mcp_gateway_decisions(tenant_id, decision_ref);

CREATE OR REPLACE FUNCTION deny_mcp_gateway_decision_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'mcp_gateway_decisions_append_only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS mcp_gateway_decisions_append_only ON mcp_gateway_decisions;
CREATE TRIGGER mcp_gateway_decisions_append_only
BEFORE UPDATE OR DELETE ON mcp_gateway_decisions
FOR EACH ROW EXECUTE FUNCTION deny_mcp_gateway_decision_mutation();
