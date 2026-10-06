# ELITZE production customer readiness

Production state is evidence-gated. The application does not seed customer records, create synthetic telemetry, or turn a missing dependency into a success state.

Required operating dependencies:
- Managed PostgreSQL: reachable, migrated and schema-verified.
- Authentication: production database plus auth encryption/session/origin configuration.
- CRM: tenant-scoped storage.
- Email provider: Postmark credentials and a verifiable delivery path; the sender/domain must be verified with Postmark.
- Authorized lead sources: real tenant-bound source with accepted ingestion evidence.
- Analytics: consent-gated measurement configuration.
- Monitoring: production runtime monitoring.
- Backups: a verified backup/restore test recorded in the ELITZE database.
- Real customer pilot data: real pilot evidence recorded in the ELITZE database.

Configuration alone is never treated as proof. Backup and customer-pilot states remain UNMEASURABLE until actual verification records exist.

Production database URLs, credentials, customer records and provider secrets never belong in source control. Architecture and code presence alone do not establish a live integration; the connected runtime path and evidence record do.
