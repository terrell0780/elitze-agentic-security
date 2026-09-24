ALTER TABLE team_channels
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

DO $$
BEGIN
  ALTER TABLE team_channels
    ADD CONSTRAINT team_channels_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES auth_tenants(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE INDEX IF NOT EXISTS team_channels_tenant_idx
  ON team_channels(tenant_id);

CREATE INDEX IF NOT EXISTS team_channels_tenant_active_idx
  ON team_channels(tenant_id, archived_at);
