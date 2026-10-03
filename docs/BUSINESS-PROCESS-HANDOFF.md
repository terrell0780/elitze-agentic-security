# ELITZE Agentic Security — Business Process Handoff

## Operating chain

`Inbound → Lead Record → Qualification → NDA → Diligence → Offer → Contract → Closing`

Public acquisition, repository-access, and general-contact submissions are persisted as acquisition leads before email notification is attempted. Email is a notification channel, not the sole system of record.

## Pipeline stages

- `NEW` — inbound request not yet qualified.
- `QUALIFIED` — buyer and transaction intent reviewed.
- `NDA` — NDA process active or completed.
- `DILIGENCE` — controlled technical, IP, legal, and operational diligence.
- `OFFER` — commercial proposal or term negotiation.
- `CONTRACT` — definitive transaction documentation.
- `CLOSED_WON` — transaction completed.
- `CLOSED_LOST` — opportunity closed without transaction.

Stage changes are recorded in `acquisition_lead_events` with actor identity and optional notes.

## Management access

`/api/acquisition/leads` is restricted to owner/admin roles or the configured `ELITZE_ACQUISITION_ADMIN_EMAIL`.

## Data boundary

Acquisition leads are separate from tenant-scoped customer CRM records until a qualified contact is converted.

## Operational boundary

Contract execution, funds settlement, domain/account transfer, and other legal transaction steps remain controlled outside the application unless separately implemented.

## Production gate

Migrations `0027_mcp_control_plane_lockdown.sql` and `0028_acquisition_pipeline.sql` must both be applied to the target production database before the runtime is considered release-aligned.

## Evidence rule

Empty lead, customer, revenue, backup, integration, or transaction records remain empty. No business outcome is inferred from code presence alone.
