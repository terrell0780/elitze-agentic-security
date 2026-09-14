CREATE TABLE IF NOT EXISTS data_bridge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id varchar(200) NOT NULL,
  name varchar(200) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  kind varchar(80) NOT NULL,
  description text,
  token_hash varchar(64) NOT NULL UNIQUE,
  token_prefix varchar(16) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_ingest_at timestamptz,
  events_accepted integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_bridge_sources_tenant ON data_bridge_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_bridge_sources_active ON data_bridge_sources(active, last_ingest_at DESC);

CREATE TABLE IF NOT EXISTS data_bridge_events (
  id uuid PRIMARY KEY,
  tenant_id varchar(200) NOT NULL,
  source_id uuid NOT NULL REFERENCES data_bridge_sources(id) ON DELETE CASCADE,
  event_id varchar(200) NOT NULL,
  event_type varchar(120) NOT NULL,
  schema_version varchar(20) NOT NULL DEFAULT '1',
  observed_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  severity varchar(40) NOT NULL DEFAULT 'unknown',
  subject varchar(300),
  action varchar(200),
  state varchar(80) NOT NULL DEFAULT 'OBSERVED',
  summary text,
  asset_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  normalized jsonb NOT NULL,
  raw_payload jsonb NOT NULL,
  content_hash varchar(64) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'ACCEPTED',
  error text,
  processed_at timestamptz,
  CONSTRAINT data_bridge_event_identity UNIQUE (tenant_id, source_id, event_id),
  CONSTRAINT data_bridge_event_hash_shape CHECK (length(content_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_data_bridge_events_tenant_received ON data_bridge_events(tenant_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_bridge_events_source_received ON data_bridge_events(source_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_bridge_events_type ON data_bridge_events(tenant_id, event_type, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_bridge_events_state ON data_bridge_events(tenant_id, state, observed_at DESC);
