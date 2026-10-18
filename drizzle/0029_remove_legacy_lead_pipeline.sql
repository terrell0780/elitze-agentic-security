-- Remove the legacy commercial lead pipeline. Keep the security workspace audit,
-- tenant, identity, and validation tables intact.
DROP TABLE IF EXISTS acquisition_lead_events;
DROP TABLE IF EXISTS acquisition_leads;
