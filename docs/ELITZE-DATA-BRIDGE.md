# ELITZE Data Bridge

The ELITZE Data Bridge is the controlled ingress layer between external security sources and the ELITZE security control plane.

## Pipeline

`External source → source authentication → tenant binding → schema validation → normalization → idempotent persistence → hash/evidence → observed security signal → ELITZE consumers`

The bridge is deliberately separate from the legacy Data Hub read API. The Data Hub may expose stored source and insight state; the Data Bridge is responsible for receiving and normalizing source events.

## Security model

- Every source is bound to exactly one `tenant_id`.
- Source credentials are random bearer tokens. Only a SHA-256 digest is stored.
- Credentials are accepted only through `x-elitze-source-token` or `Authorization: Bearer ...`.
- Disabled sources immediately stop accepting events.
- Source provisioning and inspection require `ELITZE_INTERNAL_API_KEY` using the existing constant-time internal authorization helper.
- The bridge rejects oversized requests and malformed event envelopes.
- Events are idempotent within a tenant/source boundary using `(tenant_id, source_id, event_id)`.
- Raw source payload and normalized representation are retained separately so the observed record can be traced back to source input.
- Every accepted event produces an append-only ELITZE audit-ledger record containing the source, event identity and content hash.
- No telemetry is fabricated. The bridge only reports events that were actually submitted and accepted.

## Event contract

```json
{
  "events": [
    {
      "eventId": "source-event-123",
      "eventType": "agent.tool_call",
      "observedAt": "2026-09-14T12:00:00Z",
      "severity": "high",
      "subject": "agent-42",
      "action": "tool.execute",
      "state": "OBSERVED",
      "summary": "Agent invoked a privileged tool",
      "assetIds": ["asset-9"],
      "evidenceIds": ["evidence-77"],
      "metadata": {"region": "ca-west"},
      "payload": {"tool": "example", "result": "blocked"}
    }
  ]
}
```

`eventId` should be supplied by the source. When it is omitted, ELITZE derives a deterministic event identity from the event content so repeat delivery remains idempotent.

## Endpoints

### Provision a source

`POST /api/data-bridge/sources`

Requires `x-elitze-api-key` and accepts `tenantId`, `name`, `kind`, and optional `description`.

The response contains the bearer token once. Store it in the source's secret manager. ELITZE stores only its digest.

### Ingest events

`POST /api/data-bridge/ingest`

Authenticate with the source bearer token.

Accepted events are persisted and audited. Replayed events are returned as `DUPLICATE` rather than inserted a second time.

### Inspect sources

`GET /api/data-bridge/sources?tenantId=...`

Requires the ELITZE internal API key. Secret material is never returned.

### Revoke or restore a source

`PATCH /api/data-bridge/sources/{sourceId}`

Requires the ELITZE internal API key, `tenantId`, and `active: false|true`.

### Inspect bridge events

`GET /api/data-bridge/events?tenantId=...&sourceId=...&limit=...`

Requires the ELITZE internal API key.

### Read normalized observations

`GET /api/data-bridge/observe?tenantId=...&sourceId=...&limit=...`

Requires the ELITZE internal API key. The response is normalized into ELITZE `ObservedSignal` records so downstream security workflows do not need to understand each external source format.

### Bridge health

`GET /api/data-bridge/health?tenantId=...`

Requires the ELITZE internal API key and reports configured sources plus accepted event volume.

## Database

Migration `drizzle/0011_data_bridge.sql` creates:

- `data_bridge_sources`
- `data_bridge_events`

The repository migration verifier now requires both tables to exist after migration.

## Integration boundary

The bridge provides canonical normalized observations to ELITZE. It does not silently execute infrastructure actions. Any execution path remains behind the existing policy and authorization layers.

The next consumer layer can map normalized observations into the ELITZE Security Graph, Policy Engine, SecOps workflows, vulnerability operations, evidence workflows, and continuous validation without giving external sources direct control over those systems.
