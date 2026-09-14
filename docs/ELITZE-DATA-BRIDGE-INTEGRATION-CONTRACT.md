# ELITZE Data Bridge Integration Contract

The ELITZE Data Bridge is vendor-neutral. It provides a controlled integration boundary for external security, observability, vulnerability, identity, cloud, application, or agentic-security sources without claiming a relationship or tested compatibility with any specific provider.

## Integration model

`External platform → adapter/transport → source authentication → tenant binding → validation → normalization → Data Bridge → evidence → ObservedSignal → ELITZE consumers`

A connector must fit the ELITZE adapter contract before it is presented as an implemented integration.

## Supported transport contracts

- `WEBHOOK` — an external source pushes events into the authenticated Data Bridge ingestion endpoint.
- `REST_PULL` — an ELITZE connector polls an external HTTPS endpoint and normalizes returned records.
- `EVENT_STREAM` — an approved connector consumes an authorized event stream and hands events to the Data Bridge normalization contract.
- `MCP` — an approved connector communicates through an authorized MCP boundary. MCP access does not bypass ELITZE policy enforcement.
- `CUSTOM` — explicitly reviewed adapter for a source that does not fit the standard transports.

## Connector contract

Every implemented connector exposes:

- stable connector ID and version
- supported transports
- supported capabilities
- connection validation
- health reporting where supported
- normalization into the ELITZE Data Bridge event contract
- explicit tenant context
- explicit source identity
- no implicit execution authority

Capabilities are declared as:

`INGEST`, `HEALTH`, `DISCOVERY`, `NORMALIZE`, `PUBLISH`, `EXECUTE`

An adapter must never declare a capability that is not actually implemented and tested.

## Generic connector included

ELITZE currently includes a **Generic HTTPS JSON Security Source** connector. It validates an HTTPS endpoint and bearer token and can normalize common JSON envelopes such as `items`, `events`, and `findings` into the ELITZE event contract.

This is a generic integration primitive, not a claim of compatibility with any named vendor.

## Vendor-specific integrations

A future named integration is not considered implemented merely because a vendor's API is known publicly or because the vendor appears in research, sales material, or documentation.

A named integration becomes an ELITZE implemented integration only after:

1. the source contract is verified against an authorized environment;
2. authentication and authorization are tested;
3. source fields are mapped to the ELITZE normalized event model;
4. rate limits, pagination, retries, and failure semantics are tested;
5. tenant and data-boundary behavior is tested;
6. read and write capabilities are separately reviewed;
7. evidence and audit behavior are verified;
8. automated integration tests pass;
9. product copy accurately states the implementation status.

Until then, the source is represented only as a potential integration target.

## Security boundary

External sources do not receive direct access to the ELITZE Security Graph, Policy Engine, database, or infrastructure execution layer. The Data Bridge is an ingress and normalization boundary. Any consequential action remains behind ELITZE identity, policy, authorization, approval, execution, and verification controls.

## Product and acquisition policy

ELITZE must not imply partnership, endorsement, certification, customer status, or technical compatibility that has not been verified. The connector framework exists so ELITZE can integrate rapidly when a prospective partner or buyer provides an authorized technical environment.
