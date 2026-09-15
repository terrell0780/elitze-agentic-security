# ELITZE Security Graph

## Purpose

The ELITZE Security Graph is the core evidence-bearing model for Agent Identity and MCP Runtime Security. The globe and other visual surfaces are views over this graph; they are not the source of truth.

## Node model

The graph supports:

- human identities
- agent identities
- service accounts
- models
- prompt/configuration objects
- MCP clients and servers
- tools
- API credentials
- cloud roles
- data stores
- deployment environments
- approval authorities
- policies
- policy decisions
- runtime actions
- evidence records
- verification records

## Relationship model

The graph supports explicit relationships including:

`AUTHORIZES`, `DELEGATES`, `ASSUMES`, `USES`, `INVOKES`, `ROUTES_TO`, `CAN_REACH`, `READS`, `WRITES`, `EXECUTES`, `DEPLOYED_IN`, `CONFIGURED_BY`, `GOVERNS`, `DECIDED_BY`, `RESULTED_IN`, `SUPPORTED_BY`, `VERIFIED_BY`, `PROVES`, and `DEPENDS_ON`.

Every node and edge records its tenant, source, evidence state, provenance reference where available, observation time, metadata, and a deterministic content hash.

## Real-data rule

The graph never creates operational facts from display components. No seed agents, fake tools, fabricated credentials, synthetic reachability, simulated execution results, or placeholder evidence may be inserted into production state.

Supported evidence states are:

- `OBSERVED`
- `INFERRED`
- `UNKNOWN`
- `UNMEASURABLE`

Missing evidence remains missing.

## Control questions

The graph query path is designed to answer:

1. Which agent can reach this data store?
2. Which tool, MCP server, credential, role, or delegation chain connects the path?
3. Which authority or policy granted the capability?
4. Which observed policy decision governed the action?
5. What runtime action resulted?
6. What evidence proves the result?
7. Was the original path retested?

`GET /api/security-graph?tenantId=<tenant>&from=<source>&to=<target>` returns observed graph paths when both endpoints are supplied. Without `from` and `to`, it returns tenant-scoped graph statistics.

`POST /api/security-graph` accepts authenticated, tenant-bound nodes, edges, and evidence. It requires the ELITZE internal API key.

## Smallest interrupting change

ELITZE should only identify a "smallest policy change" when the graph contains real policy, authorization, reachability, and evidence relationships sufficient to evaluate the candidate. A missing policy edge does not become a guessed recommendation. The correct state is `UNKNOWN` or `INSUFFICIENT_REACH`.

## Production acceptance

A graph path is useful for production security decisions only when its relevant relationships are backed by live connected evidence. Repository presence is not integration proof. A provider must be authenticated, observed, normalized, persisted, and attributable before its data can support a production claim.
