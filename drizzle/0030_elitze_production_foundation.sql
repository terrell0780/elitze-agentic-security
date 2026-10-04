CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  slug varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_uq UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  role varchar(40) NOT NULL DEFAULT 'member',
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_org_email_uq UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  kind varchar(40) NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_tokens_user_kind_idx ON auth_tokens(user_id, kind);

CREATE TABLE IF NOT EXISTS production_security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id varchar(120) NOT NULL,
  version varchar(40) NOT NULL,
  effect varchar(20) NOT NULL,
  rules jsonb NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_policies_org_id_uq UNIQUE (organization_id, policy_id)
);

CREATE TABLE IF NOT EXISTS production_security_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users(id),
  agent_id varchar(200),
  request_hash varchar(64) NOT NULL UNIQUE,
  action varchar(200) NOT NULL,
  decision varchar(40) NOT NULL,
  reasons jsonb NOT NULL,
  evidence_hash varchar(64),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS production_decisions_org_created_idx
  ON production_security_decisions(organization_id, created_at);

CREATE TABLE IF NOT EXISTS production_security_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type varchar(100) NOT NULL,
  subject varchar(240) NOT NULL,
  content_hash varchar(64) NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS production_evidence_org_created_idx
  ON production_security_evidence(organization_id, created_at);

CREATE TABLE IF NOT EXISTS production_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(100) NOT NULL,
  request_id varchar(120),
  metadata jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS production_audit_org_created_idx
  ON production_audit_events(organization_id, created_at);
