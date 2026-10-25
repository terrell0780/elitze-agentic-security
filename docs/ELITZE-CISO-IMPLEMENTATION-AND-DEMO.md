# ELITZE Agentic Security: CISO Implementation and Demonstration Guide

**Scope:** Agent Identity and MCP Runtime Security  
**Frameworks:** NIST Cybersecurity Framework 2.0, NIST SP 800-207 Zero Trust Architecture, NIST SP 800-218 Secure Software Development Framework.

## Positioning

**Companion architecture and threat model:** [Zero-Trust Architecture, STRIDE Threat Model, and ATT&CK Scenario](./ZERO-TRUST-STRIDE-ATTACK-MODEL.md) provides the network zones, identity/data-flow boundaries, ranked risks, CIS/NIST control mapping, and defensive ATT&CK exercise.

ELITZE Agentic Security protects agent identities, MCP servers, tool access, and sensitive execution paths. The control loop is:

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove`

Operational claims must be supported by implementation, configuration, real observations, and test evidence. Adapter code is not proof of a live integration. Missing evidence stays `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`. Production does not use mock telemetry, fake records, or placeholder success states.

**Framework mapping:** this build plan uses the requested five-function operational view: Identify, Protect, Detect, Respond, and Recover. NIST CSF 2.0 adds a sixth function, Govern; its ownership, risk strategy, policy, oversight, and supply-chain governance requirements apply across all five implementation tracks rather than being omitted.

## NIST functions and implementation priorities

| Function | Key architectural components and tools | Top two priorities | Blind spot / failure mode |
|---|---|---|---|
| **Identify** | Tenant-scoped agent/workload identity registry; MCP server/tool discovery; capability and reachability graph; provenance and freshness tracking. Use MCP, GitHub Actions, AWS IAM/CloudTrail, Microsoft Entra ID/Graph and Kubernetes adapters when authorized and configured. | 1. Canonical IDs and tenant-scoped persistence. 2. Track source, permissions, observation time, and collection health. | An adapter or stale asset inventory is presented as a successful live discovery. |
| **Protect** | Policy decision/enforcement; least privilege; capability allowlists; approval workflow; secret manager; separately authorized execution; OIDC/SAML/MFA/WebAuthn. | 1. Deny when required identity/policy evidence is missing. 2. Enforce the decision at the execution boundary, not only in the UI. | A recorded decision is mistaken for enforcement, or an identity, DNS, redirect, or tenant-boundary error bypasses policy. |
| **Detect** | Real runtime events; source normalization; correlation IDs; durable/tamper-evident evidence; freshness monitoring; threat-intelligence and SIEM connectors such as Wazuh, TheHive, MISP/OpenCTI when configured. | 1. Persist source, tenant, timestamp, integrity, and evidence references. 2. Surface failed collection and stale/missing telemetry. | Missing telemetry looks like zero risk, synthetic events appear real, or evidence-signing configuration is unavailable. |
| **Respond** | Finding and incident workflow; operator authorization; approval-bound containment; token revocation; tool/workload isolation; provider-backed action results. | 1. Scope and approve high-impact actions. 2. Verify the resulting state against the provider and retain audit evidence. | A local status says containment succeeded although the provider rejected or never executed the action. |
| **Recover** | Retest orchestration; evidence snapshots; rollback/restore; database recovery; health checks; incident closure linked to observed outcomes. | 1. Retest the original condition and record the actual result. 2. Exercise database restore and evidence verification. | Incident closure is based on a UI status instead of proof that the condition is removed and service restored. |

Tenant isolation, secret handling, default-deny behavior, provenance, request validation, secure dependencies, and regression tests apply across all functions.

## Evidence status vocabulary

| Status | Meaning |
|---|---|
| `CODE PRESENT` | Source code or configuration exists; operation has not necessarily been verified. |
| `TESTED` | An identified test ran and its actual result is available. |
| `INTEGRATED` | Real credentials and permissions were used; authenticated provider access, tenant binding and persisted results were verified. |
| `BLOCKED` | A required credential, permission, endpoint or dependency is unavailable. |
| `UNKNOWN` / `UNMEASURABLE` | Evidence is insufficient or the requested state cannot be measured reliably. |
| `INSUFFICIENT_REACH` | The current identity and permissions graph cannot support the requested reachability conclusion. |

## Repository evidence reviewed

This is a source-tree review, not a live deployment audit.

| Area | Evidence | Claim boundary |
|---|---|---|
| Product scope and production truth | `README.md`, `docs/ELITZE-FRONTIER-ENTERPRISE-SECURITY-VISION.md` | Establish the target and truth rules, not completion of every vision capability. |
| Integration architecture | `docs/ELITZE-PRODUCTION-INTEGRATIONS.md` and adapter paths for MCP, GitHub, AWS, Entra ID and Kubernetes | Live authenticated provider access and persistence must be proven per provider. |
| Database lifecycle | `scripts/production-migrate.mjs`, `scripts/production-db-health.mjs`, `drizzle/` | Scripts exist; production migration and health output must be captured on the target DB. |
| CI/release controls | `package.json`, `.github/workflows/production-gates.yml` | The workflow defines dependency audit, self-tests, typecheck, lint, build, auth E2E, SBOM, and a runner handshake for eligible non-PR runs. Check the exact release SHA's CI result before claiming green status. |
| MCP upstream hardening | [PR #99](https://github.com/terrell0780/elitze-agentic-security/pull/99) and its CI checks | Track address filtering, pinned DNS and bounded HTTPS behavior on the current candidate. Verify merge state and successful regression/production gates against the exact candidate SHA before making an operational or release claim. |
| Dependency licensing | `npm run licenses:inventory`, package lock, `scripts/license-inventory.mjs` | Generate the inventory from the exact candidate lockfile and review unknown/nonstandard licenses. |

## Walkthrough: a real controlled demonstration

Use staging, one disposable tenant, an authorized test identity, a controlled MCP server, and non-sensitive test data. Do not start with production or destructive tools.

1. **Pin the release.** Record repository URL, commit SHA, deployment environment, lockfile hash, CI run URL, and migration version. Confirm the deployed version matches the reviewed commit.
2. **Prove database readiness.** Configure real environment secrets through the secret manager; run the migration and health checks against the intended staging database. Save sanitized output and exit codes.
3. **Show discovery.** Connect one authorized provider. Show provider identity, authentication result, permissions, source metadata, timestamp, and persisted records. Demonstrate how missing credentials or access is displayed instead of inventing assets.
4. **Show policy before execution.** Use a harmless permitted tool and a denied case. Display tenant and agent identity, tool, policy version, request ID, decision/reasons, constraints, and evidence reference. Verify denied calls never reach the upstream tool.
5. **Show separately authorized execution.** With execution disabled, prove no upstream request occurs. Then, if explicitly approved, enable a harmless staging action and show the real provider response and outcome. Authorization by itself is not proof of execution.
6. **Show observation and retesting.** Trace the result into durable evidence. Verify its integrity metadata. In staging, alter a copy of the evidence and show that integrity verification rejects it. Demonstrate `UNKNOWN` or `INSUFFICIENT_REACH` for insufficient data.
7. **Close with proof.** Save sanitized screenshots/logs and links to the exact commit, CI run, connector test and evidence IDs. Label every feature as `CODE PRESENT`, `TESTED`, `INTEGRATED`, or `UNKNOWN`. Do not show unsupported customer, outcome, savings or performance claims.

## Build and test commands

Run from a clean checkout with the lockfile. Provider and database operations need the proper disposable CI/staging dependencies.

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm run db:config-self-test
npm run production-config:self-test
npm run security:self-test
npm run auth:security-self-test
npm run data-bridge:self-test
npm run mcp-workload-identity:self-test
npm run policy-evidence:self-test
npm run live-validation:self-test
npm run typecheck
npm run lint
npm run build
npm run auth:e2e-safety-self-test
npm run auth:e2e-self-test
npm sbom --sbom-format cyclonedx --sbom-type application --omit=dev > sbom.cdx.json
npm run licenses:inventory
```

The MCP upstream address regression command is `npm run mcp-upstream-address:self-test`; verify it exists and passes on the release candidate. Commands above describe the verification plan; they are not a claim that every command was run in this authoring pass. A PR CI run skips the production runner handshake and is not release approval.

## Deployment procedure

1. Provision separated staging/production environments and a managed PostgreSQL/Neon database.
2. Set `DATABASE_URL`, auth/encryption/evidence-signing secrets, allowed origins, email provider, runner endpoint/HMAC secret and only the authorized integration credentials in the secret manager.
3. Set exact MCP outbound host allowlists; keep outbound execution unavailable until the authorized test is approved.
4. Run the repository's production gates, `npm run db:production-migrate`, `npm run db:production-health`, authentication E2E, dependency audit and SBOM generation in the governed release flow.
5. Verify `GET /api/health`, the authenticated tenant/identity path, email flows where enabled, and one harmless provider integration. Record sanitized evidence.
6. Verify the signed runner challenge-response for release validation. Then check rollback, recovery and post-deployment health procedures.
7. Promote only after the exact commit, mandatory checks, live integration evidence and rollback plan have been reviewed. This guide does not authorize a deployment.

README-listed API surfaces include `GET /api/health`, `GET /api/security/skills`, `POST /api/security/decision`, `POST /api/data-bridge/ingest`, `GET /api/data-bridge/observe`, `GET /api/data-bridge/health`, and `GET /api/data-bridge/adapters`. Test protected routes only with an authorized tenant context.

## Internal rollout and demonstration readiness

Before an authorized staging or production rollout, record:

- Repository commit SHA, review history, architecture, build/test results, migrations, and recovery runbooks.
- Dependency lockfile, software bill of materials, license inventory, and required open-source notices.
- Source provenance, contributor records, third-party rights, and separate evidence for domain and trademark control.
- Sanitized environment examples, infrastructure inventory, database restore steps, authorized provider connections, and credential-rotation requirements.
- Exact CI/test artifacts, evidence-integrity results, connector test records, and unresolved prerequisites.
- Environment owner approval, approved deployment target, scope of change, rollback plan, and post-change health evidence.

Never include credentials or live secrets in a handoff. Do not deploy without explicit deployment authorization. A demonstration must use real authorized evidence or clearly labeled synthetic examples; it must not present illustrative data as live telemetry.

## References

- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)
- [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [NIST SP 800-218 — Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [Production integrations](./ELITZE-PRODUCTION-INTEGRATIONS.md)
- [Enterprise security vision](./ELITZE-FRONTIER-ENTERPRISE-SECURITY-VISION.md)
