CREATE TABLE IF NOT EXISTS security_identities (
  id serial PRIMARY KEY,
  subject varchar(200) NOT NULL UNIQUE,
  kind varchar(40) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'active',
  owner varchar(160),
  purpose text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_policies (
  id serial PRIMARY KEY,
  policy_id varchar(120) NOT NULL UNIQUE,
  version varchar(40) NOT NULL,
  effect varchar(20) NOT NULL,
  scope varchar(120) NOT NULL,
  rules jsonb NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_decisions (
  id serial PRIMARY KEY,
  request_hash varchar(64) NOT NULL UNIQUE,
  actor_id varchar(200) NOT NULL,
  agent_id varchar(200),
  action varchar(200) NOT NULL,
  decision varchar(30) NOT NULL,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_version varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attack_paths (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  severity varchar(20) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'open',
  nodes jsonb NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS red_team_runs (
  id serial PRIMARY KEY,
  target varchar(240) NOT NULL,
  campaign varchar(160) NOT NULL,
  mode varchar(40) NOT NULL DEFAULT 'authorized',
  status varchar(40) NOT NULL DEFAULT 'queued',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS evidence_records (
  id serial PRIMARY KEY,
  event_type varchar(100) NOT NULL,
  subject varchar(240) NOT NULL,
  content_hash varchar(64) NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_decisions_created_at ON security_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_attack_paths_status ON attack_paths(status);
CREATE INDEX IF NOT EXISTS idx_red_team_runs_status ON red_team_runs(status);
CREATE INDEX IF NOT EXISTS idx_evidence_records_subject ON evidence_records(subject);
