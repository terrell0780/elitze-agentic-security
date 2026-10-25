# ELITZE Production and Customer Readiness

> Operational readiness checklist. This document does not establish that production dependencies are connected or that customer evidence exists.

Production state is evidence-gated. The application does not seed customer records, create synthetic telemetry, or turn a missing dependency into a success state.

Required operating dependencies:
- Managed PostgreSQL: reachable, migrated and schema-verified.
- Authentication: production database plus auth encryption/session/origin configuration.
- CRM: tenant-scoped storage.
- Email provider: configured credentials and a verifiable delivery path; the sender/domain must be verified with the selected provider.
- Authorized integrations: explicitly approved, tenant-bound feed or scanner with accepted ingestion evidence.
- Analytics: consent-gated measurement configuration.
- Monitoring: production runtime monitoring.
- Backups: a verified backup/restore test recorded in the ELITZE database.
- Real customer pilot data: real pilot evidence recorded in the ELITZE database.

Configuration alone is never treated as proof. Backup and customer-pilot states remain UNMEASURABLE until actual verification records exist.

Production database URLs, credentials, customer records and provider secrets never belong in source control. Architecture and code presence alone do not establish a live integration; the connected runtime path and evidence record do.
