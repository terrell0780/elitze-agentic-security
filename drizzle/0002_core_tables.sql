CREATE TABLE IF NOT EXISTS agents (
  id serial PRIMARY KEY,
  name varchar(160) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  owner varchar(160) NOT NULL,
  framework varchar(80) NOT NULL,
  surface varchar(80) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'active',
  risk_score integer NOT NULL DEFAULT 0,
  purpose text NOT NULL,
  purpose_bound boolean NOT NULL DEFAULT true,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  nhi_id varchar(120),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discoveries (
  id serial PRIMARY KEY,
  kind varchar(40) NOT NULL,
  name varchar(200) NOT NULL,
  location varchar(300) NOT NULL,
  severity varchar(20) NOT NULL DEFAULT 'medium',
  details text NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'open',
  discovered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hitl_approvals (
  id serial PRIMARY KEY,
  agent_slug varchar(160) NOT NULL,
  action varchar(200) NOT NULL,
  blast_radius varchar(40) NOT NULL,
  rationale text NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by varchar(120)
);

CREATE TABLE IF NOT EXISTS asi_controls (
  id serial PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE,
  title varchar(160) NOT NULL,
  control text NOT NULL,
  coverage integer NOT NULL DEFAULT 0,
  status varchar(40) NOT NULL DEFAULT 'partial'
);

CREATE TABLE IF NOT EXISTS enforcement_events (
  id serial PRIMARY KEY,
  agent_slug varchar(160) NOT NULL,
  event_type varchar(80) NOT NULL,
  severity varchar(20) NOT NULL,
  summary text NOT NULL,
  intent_mismatch boolean NOT NULL DEFAULT false,
  latency_ms real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_gaps (
  id serial PRIMARY KEY,
  title varchar(200) NOT NULL,
  demand varchar(20) NOT NULL,
  buyer varchar(120) NOT NULL,
  why text NOT NULL,
  elitze_status varchar(40) NOT NULL,
  differentiator boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  role varchar(120) NOT NULL,
  org varchar(160) NOT NULL,
  email_domain varchar(120),
  agents jsonb NOT NULL DEFAULT '[]'::jsonb,
  integrations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_tier varchar(20) NOT NULL DEFAULT 'low',
  last_contact_at timestamptz DEFAULT now(),
  notes text
);

CREATE TABLE IF NOT EXISTS crm_actions (
  id serial PRIMARY KEY,
  contact_id integer NOT NULL,
  agent_slug varchar(160),
  action_type varchar(80) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'pending',
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS top_agents (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  slug varchar(120) NOT NULL UNIQUE,
  tier integer NOT NULL,
  parent_slug varchar(120),
  framework varchar(80) NOT NULL,
  has_langgraph boolean NOT NULL DEFAULT true,
  has_bini_claws boolean NOT NULL DEFAULT true,
  reasoning_type varchar(120),
  mythos_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  search_domain varchar(120),
  max_depth integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS use_cases (
  id serial PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  category varchar(80) NOT NULL,
  title varchar(200) NOT NULL,
  summary text NOT NULL,
  problem text NOT NULL,
  approach text NOT NULL,
  outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  industries jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agent_integrations (
  id serial PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  kind varchar(80) NOT NULL,
  tagline varchar(240) NOT NULL,
  description text NOT NULL,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  elitze_controls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(40) NOT NULL DEFAULT 'supported',
  website varchar(300),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gods_eye_findings (
  id serial PRIMARY KEY,
  target varchar(200) NOT NULL,
  finding_type varchar(80) NOT NULL,
  title varchar(240) NOT NULL,
  severity varchar(20) NOT NULL,
  detail text NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'open',
  discovered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_sources (
  id serial PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  kind varchar(80) NOT NULL,
  provider varchar(160) NOT NULL,
  endpoint text NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'connected',
  last_ingest_at timestamptz DEFAULT now(),
  events_today integer NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS insights (
  id serial PRIMARY KEY,
  kind varchar(60) NOT NULL,
  title varchar(240) NOT NULL,
  summary text NOT NULL,
  evidence text NOT NULL,
  severity varchar(20) NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(40) NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_discoveries_status ON discoveries(status);
CREATE INDEX IF NOT EXISTS idx_hitl_approvals_status ON hitl_approvals(status);
CREATE INDEX IF NOT EXISTS idx_enforcement_events_created_at ON enforcement_events(created_at);
CREATE INDEX IF NOT EXISTS idx_gods_eye_findings_status ON gods_eye_findings(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
