# ELITZE Agentic Security — Enterprise Control Hardening

This release candidate records only controls that are implemented in code or explicitly remain dependent on external infrastructure.

## Implemented in this hardening pass

- Durable, tenant-scoped audit ledger in PostgreSQL.
- Per-tenant serialized audit writes using PostgreSQL transaction advisory locks.
- SHA-256 chained audit records with sequence numbers and previous-hash linkage.
- Database trigger rejecting UPDATE/DELETE mutations to the audit ledger.
- Audit-chain verification routine.
- Security decisions fail closed when audit persistence is unavailable.
- Expanded default policy set for tenant boundary, subject identity, explicit action, MCP server identity, tool identity, and restricted-data model/provider binding.
- Kill-switch request persistence with tenant scope and idempotency key.
- Kill-switch executor receives the idempotency key and request ID.
- Kill-switch success requires an explicit `verified: true` executor response; an accepted-but-unverified response is not reported as successful containment.
- Containment failure and verification states are persisted and audited.
- Security self-test covers tenant boundary, agent identity, purpose binding, MCP identity, request hashing, and hash-chain tamper behavior.

## Still not claimed as complete

- Enterprise OIDC/SSO, MFA/passkeys, and lifecycle provisioning.
- Cryptographically authoritative mapping from authenticated human/service principal to tenant and agent identity. The current internal API-key boundary is not a replacement for enterprise IAM.
- KMS-backed per-tenant encryption and key rotation.
- Independent immutable/WORM audit retention outside the application database.
- Disaster recovery with demonstrated RPO/RTO and restore tests.
- Production containment executor itself; ELITZE only reports `verified` when the configured executor proves containment.
- Full CI security release gates, SBOM generation/signing, dependency policy, and external penetration testing.
- Complete enforcement coverage for every future execution adapter/path until each path is wired through the same policy boundary.

No ranking, traffic, customer, review, conversion, or security-effectiveness metric is inferred from these controls.
