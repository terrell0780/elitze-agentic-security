# ELITZE Operational Evidence Snapshot

The authenticated `GET /api/console/evidence-snapshot` endpoint downloads a tenant-scoped JSON snapshot of recorded security-graph nodes and edges, validation request statuses, completed requests with available evidence, findings counts, telemetry counts, and runner configuration state.

## Evidence semantics

- `OBSERVED` means a corresponding database record or aggregate was retrieved; it is not an independent assertion that the external system is secure.
- `INSUFFICIENT_EVIDENCE` means no completed validation with available evidence was recorded in the queried tenant data.
- `CONFIGURED_NOT_LIVE_VERIFIED` means runner configuration is present according to the control-plane configuration check. This snapshot does not call runner health or perform a scan.
- `NOT_RUNTIME_VERIFIED` and `OUT_OF_BAND_EVIDENCE_REQUIRED` explicitly identify controls that cannot be proven by these database aggregates.

The endpoint requires an authenticated session and scopes all queries to the current tenant. The export contains aggregate counts and timestamps only; it excludes targets, credentials, detailed findings, raw event payloads, and secret values. It uses `Cache-Control: no-store, private` and a downloadable JSON content disposition.

This snapshot is a convenience for technical diligence, not a certification, penetration-test report, IP ownership opinion, customer/revenue proof, or independent audit. Buyer-facing claims must be supported by the underlying evidence and the remaining gaps must be disclosed.
