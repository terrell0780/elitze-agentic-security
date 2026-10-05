CREATE TABLE IF NOT EXISTS chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  channel_id integer NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  uploaded_by varchar(200) NOT NULL,
  file_name varchar(300) NOT NULL,
  content_type varchar(160) NOT NULL,
  size_bytes bigint NOT NULL,
  sha256 varchar(64) NOT NULL,
  scan_state varchar(40) NOT NULL DEFAULT 'NOT_CONFIGURED',
  content bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_attachments_tenant_idx ON chat_attachments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_attachments_channel_idx ON chat_attachments(channel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS team_message_attachments (
  message_id integer NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  attachment_id uuid NOT NULL REFERENCES chat_attachments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, attachment_id)
);

ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS ai_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  kind varchar(20) NOT NULL,
  protocol varchar(40) NOT NULL,
  base_url text NOT NULL,
  model varchar(160),
  encrypted_secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind IN ('model','agent','bot')),
  CHECK (protocol IN ('OPENAI_COMPATIBLE','ELITZE_AGENT','ELITZE_BOT'))
);
CREATE INDEX IF NOT EXISTS ai_connections_tenant_idx ON ai_connections(tenant_id, enabled, created_at DESC);

CREATE TABLE IF NOT EXISTS team_voice_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  channel_id integer NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  actor_id varchar(200) NOT NULL,
  display_name varchar(200),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS team_voice_presence_active_uq
  ON team_voice_presence(channel_id, actor_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS team_voice_presence_channel_idx
  ON team_voice_presence(tenant_id, channel_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS team_voice_signals (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  channel_id integer NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  from_actor_id varchar(200) NOT NULL,
  to_actor_id varchar(200) NOT NULL,
  signal_type varchar(20) NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (signal_type IN ('offer','answer','candidate','bye'))
);
CREATE INDEX IF NOT EXISTS team_voice_signals_delivery_idx
  ON team_voice_signals(tenant_id, channel_id, to_actor_id, consumed_at, created_at);

CREATE TABLE IF NOT EXISTS teamspeak_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  webquery_url text NOT NULL,
  encrypted_api_key text NOT NULL,
  server_id integer,
  enabled boolean NOT NULL DEFAULT true,
  last_state varchar(40),
  last_checked_at timestamptz,
  created_by varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teamspeak_integrations_tenant_idx
  ON teamspeak_integrations(tenant_id, enabled, created_at DESC);
