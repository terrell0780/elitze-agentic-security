# ELITZE Agentic Security — Enterprise Control Hardening

This document separates repository-tested controls from deployment-dependent controls. A route, adapter, or configuration file is not evidence that a live provider connection is operating.

## Release verification

The latest production-gate and runner-handshake workflows for `main` have not completed their jobs: GitHub created the jobs with no assigned runner and no executed steps. The production deployment for commit `cf33c15a64f85e0570ca0a4b8349ac4ce2d78f8b` is marked READY by Vercel. The website verifier receives Vercel's rate-limit/security checkpoint, so that result is not treated as an application health check.

Required CI gates include typecheck, lint, production build, dependency audit, configuration contracts, database migrations, authentication tests, tenant isolation, security-fabric checks, vulnerability intelligence, runner handshake, and SBOM generation/upload. Report each gate as passed only when its actual job steps execute and succeed.

## Implemented controls with repository test coverage

- Tenant-scoped PostgreSQL audit ledger.
- Per-tenant serialized audit writes using PostgreSQL transaction advisory locks.
- SHA-256 chained audit records with sequence numbers and previous-hash linkage.
- Database trigger rejecting UPDATE/DELETE mutations to the audit ledger.
- Audit-chain verification routine.
- Security decisions fail closed when audit persistence is unavailable.
- Policy checks for tenant boundary, subject identity, explicit action, MCP server identity, tool identity, and restricted-data model/provider binding.
- Tenant-scoped kill-switch request persistence with idempotency key.
- Kill-switch success requires an explicit `verified=true` executor response; accepted-but-unverified containment is not reported as successful.
- Self-tests for tenant boundary, agent identity, purpose binding, MCP identity, request hashing, and hash-chain tamper behavior.
- Email/password authentication, email verification, password reset, session handling, MFA, WebAuthn/passkey implementation checks, OIDC/SAML implementation checks, CSRF/origin controls, rate limiting, and authentication E2E coverage.
- PostgreSQL/pgvector migrations and security control-plane table verification in CI.
- Tenant-scoped security graph and evidence isolation checks.
- RAG/vector schema and tenant-bound retrieval implementation.
- Security-fabric tenant binding and autonomous-analyst latest-run correctness.
- SBOM generation/upload in CI.

## Deployment-dependent controls

These require live infrastructure and must not be inferred from adapter code alone:

- Production database and deployment secret configuration.
- Live email provider credentials and delivery.
- Live enterprise OIDC/SAML identity-provider configuration.
- Live provider integrations for AWS, Azure/Entra, GitHub, Kubernetes, MCP, threat intelligence, endpoint, network, and scanner adapters.
- Production containment executor and independently verified containment.
- KMS-backed per-tenant encryption and demonstrated key rotation.
- Independent immutable/WORM audit retention outside the application database.
- Demonstrated disaster-recovery RPO/RTO and restore tests.
- External penetration testing or independent security assurance.
- External evidence for customer, performance, or security-effectiveness claims.

## Evidence handling

The application must not seed synthetic operational records or convert missing evidence into positive states. Missing or unavailable evidence remains `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH` as appropriate.

Do not infer rankings, traffic, customer counts, reviews, conversion, financial results, or security effectiveness from repository controls.

## Operational verification sequence

1. Restore successful GitHub runner allocation and execute every required workflow step.
2. Verify the production deployment's canonical domain, key routes, response headers, and health endpoint.
3. Confirm production database connectivity and migration state without changing production data.
4. Exercise authentication, tenant isolation, policy decisions, runner handshake, and failure-closed behavior against authorized production configuration.
5. Confirm provider integrations only where real credentials and live records support the result.
6. Record the evidence and timestamp for each completed check.
