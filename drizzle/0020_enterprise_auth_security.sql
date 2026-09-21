CREATE TABLE IF NOT EXISTS auth_mfa_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  factor_type text NOT NULL CHECK (factor_type IN ('totp','webauthn')),
  label text,
  secret_ciphertext text,
  enabled_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS auth_mfa_factors_user_idx ON auth_mfa_factors(tenant_id, user_id, revoked_at);

CREATE TABLE IF NOT EXISTS auth_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_recovery_codes_user_idx ON auth_recovery_codes(tenant_id, user_id, consumed_at);

CREATE TABLE IF NOT EXISTS auth_webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  device_type text,
  backed_up boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS auth_webauthn_user_idx ON auth_webauthn_credentials(tenant_id, user_id, revoked_at);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES auth_tenants(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('webauthn_registration','webauthn_authentication','oidc_login','saml_login','privileged_reauth','mfa_login')),
  challenge_hash text NOT NULL,
  state_hash text,
  nonce_hash text,
  code_verifier_ciphertext text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_challenges_lookup_idx ON auth_challenges(challenge_hash, purpose, expires_at, consumed_at);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  family_id uuid NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  replaced_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_family_idx ON auth_refresh_tokens(tenant_id, family_id, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS auth_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_api_keys_tenant_idx ON auth_api_keys(tenant_id, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS auth_privileged_reauth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  session_id uuid REFERENCES auth_sessions(id) ON DELETE CASCADE,
  challenge_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  satisfied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_privileged_reauth_user_idx ON auth_privileged_reauth(tenant_id, user_id, expires_at);

ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false;
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS mfa_enrolled_at timestamptz;
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
