CREATE TABLE IF NOT EXISTS "debug_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" varchar(80) NOT NULL UNIQUE,
  "actor_id" varchar(200) NOT NULL,
  "entry" varchar(400) NOT NULL,
  "cwd" varchar(500) NOT NULL,
  "status" varchar(40) NOT NULL DEFAULT 'starting',
  "started_at" timestamptz NOT NULL DEFAULT now(),
  "ended_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "debug_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" varchar(80) NOT NULL,
  "event_type" varchar(80) NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "debug_events_session_idx" ON "debug_events" ("session_id");
CREATE INDEX IF NOT EXISTS "debug_events_created_idx" ON "debug_events" ("created_at");
