-- Remove the unused commercial CRM tables from the cybersecurity workspace.
-- Drop the action table first in case a foreign key references contacts.
DROP TABLE IF EXISTS crm_actions;
DROP TABLE IF EXISTS crm_contacts;
