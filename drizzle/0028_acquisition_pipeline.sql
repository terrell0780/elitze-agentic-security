CREATE TABLE IF NOT EXISTS acquisition_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('acquisition','repository','general')),
  stage text NOT NULL DEFAULT 'NEW' CHECK (stage IN ('NEW','QUALIFIED','NDA','DILIGENCE','OFFER','CONTRACT','CLOSED_WON','CLOSED_LOST')),
  name varchar(120) NOT NULL,
  organization varchar(160) NOT NULL,
  email varchar(254) NOT NULL,
  message text NOT NULL,
  source text NOT NULL,
  notes text,
  next_action_at timestamptz,
  converted_contact_id integer REFERENCES crm_contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acquisition_leads_stage_idx ON acquisition_leads(stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS acquisition_leads_created_idx ON acquisition_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS acquisition_leads_email_idx ON acquisition_leads(email);

CREATE TABLE IF NOT EXISTS acquisition_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES acquisition_leads(id) ON DELETE CASCADE,
  from_stage text CHECK (from_stage IS NULL OR from_stage IN ('NEW','QUALIFIED','NDA','DILIGENCE','OFFER','CONTRACT','CLOSED_WON','CLOSED_LOST')),
  to_stage text NOT NULL CHECK (to_stage IN ('NEW','QUALIFIED','NDA','DILIGENCE','OFFER','CONTRACT','CLOSED_WON','CLOSED_LOST')),
  actor_email varchar(254) NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acquisition_lead_events_lead_idx ON acquisition_lead_events(lead_id, created_at DESC);
