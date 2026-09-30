# ELITZE Agentic Security — Enterprise Control Hardening

This document records the current repository control state without treating code presence as proof of a live provider integration.

## Verified in the latest release-gate run

The current main release-gate run passed the repository code-review, verification, and final release gates. Those gates cover typecheck, lint, production build, dependency audit, production configuration contracts, database migration verification, authentication security/E2E, tenant isolation checks, security-fabric checks, RAG/vector checks, acquisition routing, compliance/legal controls, progressive proofing, pentest-request controls, evidence expressions, and SBOM generation/upload.

The CI environment is controlled test infrastructure. A CI pass does not by itself prove that an external production deployment has the required provider credentials or configuration.

## Implemented and verified by repository tests

- Durable, tenant-scoped audit ledger in PostgreSQL.
- Per-tenant serialized audit writes using PostgreSQL transaction advisory locks.
- SHA-256 chained audit records with sequence numbers and previous-hash linkage.
- Database trigger rejecting UPDATE/DELETE mutations to the audit ledger.
- Audit-chain verification routine.
- Security decisions fail closed when audit persistence is unavailable.
- Expanded default policy set for tenant boundary, subject identity, explicit action, MCP server identity, tool identity, and restricted-data model/provider binding.
- Kill-switch request persistence with tenant scope and idempotency key.
- Kill-switch success requires an explicit verified=true executor response; accepted-but-unverified containment is not reported as successful.
- Security self-test coverage for tenant boundary, agent identity, purpose binding, MCP identity, request hashing, and hash-chain tamper behavior.
- Email/password authentication, email verification, password reset, session handling, MFA flow, WebAuthn/passkey implementation checks, OIDC/SAML implementation checks, CSRF/origin controls, rate limiting, and real-auth CI E2E coverage.
- PostgreSQL/pgvector migration and required security control-plane table verification in CI.
- Tenant-scoped security graph and evidence isolation checks.
- RAG/vector schema and tenant-bound retrieval implementation.
- Security-fabric tenant binding and autonomous-analyst latest-run correctness.
- Acquisition/contact routing and canonical .info domain checks.
- SBOM generation/upload in CI.

## External or deployment-dependent controls

These remain dependent on real infrastructure and must not be represented as live merely because the repository contains adapter code:

- Production DATABASE_URL and deployment secret configuration.
- Live production email provider credentials and delivery.
- Live enterprise OIDC/SAML identity-provider configuration.
- Live Google OAuth is not part of the current login surface.
- Live customer/provider integrations for AWS, Azure/Entra, GitHub, Kubernetes, MCP, threat-intelligence, endpoint, network, scanner, or other adapters.
- Production containment executor and independently verified containment.
- KMS-backed per-tenant encryption and demonstrated key rotation.
- Independent immutable/WORM audit retention outside the application database.
- Demonstrated disaster-recovery RPO/RTO and restore tests.
- External penetration testing or independent security assurance.
- Customer/revenue/performance claims requiring external evidence.

## Production truth

The repository must not seed synthetic operational records or convert missing evidence into positive states. Missing or unavailable evidence remains UNKNOWN, UNMEASURABLE, or INSUFFICIENT_REACH as appropriate.

No ranking, traffic, customer, review, conversion, financial-result, or security-effectiveness metric is inferred from these controls.

## Handoff rule

A buyer can verify the source and CI evidence immediately. Live production claims require inspection of the deployment environment, provider credentials/configuration, database state, domain ownership, and external assurance evidence separately.
