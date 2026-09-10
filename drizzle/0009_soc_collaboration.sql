CREATE TABLE IF NOT EXISTS decision_evidence (
  id serial PRIMARY KEY,
  decision_id integer NOT NULL REFERENCES security_decisions(id) ON DELETE CASCADE,
  evidence_id integer NOT NULL REFERENCES evidence_records(id) ON DELETE CASCADE,
  relationship varchar(60) NOT NULL DEFAULT 'supports',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS decision_evidence_decision_idx ON decision_evidence(decision_id);
CREATE INDEX IF NOT EXISTS decision_evidence_evidence_idx ON decision_evidence(evidence_id);

CREATE TABLE IF NOT EXISTS analyst_feedback (
  id serial PRIMARY KEY,
  decision_id integer REFERENCES security_decisions(id) ON DELETE SET NULL,
  analyst_id varchar(200) NOT NULL,
  verdict varchar(40) NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analyst_feedback_decision_idx ON analyst_feedback(decision_id);
CREATE INDEX IF NOT EXISTS analyst_feedback_created_idx ON analyst_feedback(created_at);

CREATE TABLE IF NOT EXISTS team_channels (
  id serial PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  description text,
  channel_type varchar(40) NOT NULL DEFAULT 'team',
  incident_id integer,
  created_by varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS team_channels_type_idx ON team_channels(channel_type);

CREATE TABLE IF NOT EXISTS team_messages (
  id serial PRIMARY KEY,
  channel_id integer NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  author_id varchar(200) NOT NULL,
  author_type varchar(40) NOT NULL DEFAULT 'human',
  body text NOT NULL,
  reply_to_id integer REFERENCES team_messages(id) ON DELETE SET NULL,
  linked_decision_id integer REFERENCES security_decisions(id) ON DELETE SET NULL,
  linked_evidence_id integer REFERENCES evidence_records(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS team_messages_channel_created_idx ON team_messages(channel_id, created_at);
CREATE INDEX IF NOT EXISTS team_messages_decision_idx ON team_messages(linked_decision_id);

CREATE TABLE IF NOT EXISTS team_channel_members (
  id serial PRIMARY KEY,
  channel_id integer NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  actor_id varchar(200) NOT NULL,
  role varchar(40) NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS team_channel_members_active_uq ON team_channel_members(channel_id, actor_id) WHERE left_at IS NULL;
