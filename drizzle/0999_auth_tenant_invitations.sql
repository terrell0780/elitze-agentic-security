CREATE TABLE IF NOT EXISTS auth_tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  email_normalized text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'approver', 'viewer')),
  invited_by_user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_tenant_invitations_tenant_idx
  ON auth_tenant_invitations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_tenant_invitations_pending_idx
  ON auth_tenant_invitations(tenant_id, email_normalized, expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
