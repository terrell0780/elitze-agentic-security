CREATE TABLE IF NOT EXISTS production_readiness_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 category text NOT NULL CHECK (category IN ('backup_restore','customer_pilot')),
 status text NOT NULL CHECK (status IN ('VERIFIED','REVOKED')),
 observed_at timestamptz NOT NULL DEFAULT now(),
 source text NOT NULL,
 evidence_ref text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS production_readiness_evidence_category_idx ON production_readiness_evidence(category,status,observed_at DESC);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE crm_actions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE insights ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE gods_eye_findings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE security_decisions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE enforcement_events ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE attack_paths ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE red_team_runs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
ALTER TABLE evidence_records ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS crm_contacts_tenant_idx ON crm_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS crm_actions_tenant_idx ON crm_actions(tenant_id);
CREATE INDEX IF NOT EXISTS data_sources_tenant_idx ON data_sources(tenant_id);
CREATE INDEX IF NOT EXISTS insights_tenant_idx ON insights(tenant_id);
CREATE INDEX IF NOT EXISTS gods_eye_findings_tenant_idx ON gods_eye_findings(tenant_id);
CREATE INDEX IF NOT EXISTS security_decisions_tenant_idx ON security_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS enforcement_events_tenant_idx ON enforcement_events(tenant_id);
CREATE INDEX IF NOT EXISTS attack_paths_tenant_idx ON attack_paths(tenant_id);
CREATE INDEX IF NOT EXISTS red_team_runs_tenant_idx ON red_team_runs(tenant_id);
CREATE INDEX IF NOT EXISTS evidence_records_tenant_idx ON evidence_records(tenant_id);
ALTER TABLE data_sources ALTER COLUMN status SET DEFAULT 'UNCONFIGURED';
ALTER TABLE data_sources ALTER COLUMN last_ingest_at DROP DEFAULT;
