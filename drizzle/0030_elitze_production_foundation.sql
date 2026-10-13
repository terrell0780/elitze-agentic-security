CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  slug varchar(120) NOT NULL,
  kind varchar(40) NOT NULL DEFAULT 'enterprise',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_uq UNIQUE (slug)
);

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS kind varchar(40) NOT NULL DEFAULT 'enterprise';

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
