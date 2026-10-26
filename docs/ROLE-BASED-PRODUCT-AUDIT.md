# ELITZE role-based product audit

**Status: code and preview gates reviewed; production go-live is not signed off.** This is an evidence-based snapshot, not a claim that every end-to-end user journey or every optional provider is live.

## Role and journey matrix

| Persona | Implemented path | What was checked | Remaining dependency / limit |
|---|---|---|---|
| Public visitor | Public pages, help, legal and integrations overview | Production /api/health and /integrations returned HTTP 200; security response headers were present | Production still runs the current main build. Changes in PR #141 are not live until merged and deployed. |
| New individual user | Register, email verification, login, recovery and authenticated console | Auth/security static gates, typecheck, lint, production build; signup-rate-limit contract | Full registration, delivery, verification and session journey has not been run end-to-end against production services in this audit. Requires working mail and database credentials. |
| Business / tenant owner | New tenant ownership, organization name/slug, members/invitations | Tenant role/onboarding self-test passed on the preview; organization APIs bind tenant to authenticated user; owner-only organization edits enforced server-side | Cross-tenant data isolation is not ready for a multi-customer production sign-off; see blocker below. |
| Security admin | Manage tenant membership; invite non-admin roles | API role checks and role self-test reviewed | Cannot grant another security admin; application must have verified email delivery configured for invites. |
| Analyst / member | Security read/write capabilities in canonical tenant-role model | Legacy role normalization and authorization static checks passed | Cross-tenant and real authenticated journey E2E remain unverified. |
| Approver | Read security data and handle governed approvals | Canonical role mapping and existing approval/security tests retained | End-to-end approval lifecycle has not been exercised with separate real test accounts during this audit. |
| Read-only viewer | Read-only role in the tenant role model | Role normalization and invitation constraints checked | Full UI/API negative-permission E2E with a real viewer account remains to be run. |
| Platform owner | Global readiness and detailed operations diagnostics | Separate allowlist-based isPlatformOwner guard; static boundary test passed; tenant owner no longer grants platform-wide diagnostics | ELITZE_PLATFORM_OWNER_EMAILS is not configured in the inspected Vercel environment metadata, so platform-owner access fails closed until an authorized address is provisioned. Do not use a tenant-editable field or public contact address to grant this role. |

## Security-tool integrations in PR #141

| Integration | Implemented interface | Current operational status |
|---|---|---|
| Nmap | Authenticated POST /api/integrations/security-tools/nmap/import; bounded XML parsing and tenant-scoped evidence | Importer implemented and self-test passed. Scanning still runs on an authorized external runner; raw XML and script output are not retained. |
| John the Ripper | Authenticated POST /api/integrations/security-tools/john-the-ripper/import; summary-only import | Importer implemented and self-test passed. Runs against authorized hash material on a controlled worker; plaintext passwords are not persisted. |
| Aircrack-ng | Authenticated POST /api/integrations/security-tools/aircrack-ng/import; airodump survey CSV parsing | Survey importer implemented and self-test passed. It imports access-point metadata only, not client/station records, recovered keys, packet injection, or cracking activity. |
| Metasploit Framework | Authenticated POST /api/integrations/security-tools/metasploit/observe; read-only HTTPS bridge health/session observation | Code and self-test are present. The separately hosted HTTPS bridge and server-side bridge credentials are not configured/verified; arbitrary exploit-module execution is intentionally not exposed by this web endpoint. |

## Build and test evidence

- Preview commit 2daff425ae31d7e5e36bbf6bcf0b1d1f3c360db5 reached Vercel READY.
- The Vercel preview ran scripts/ci-verified-gates.mjs and logged "All configured build and security gates passed." This includes TypeScript, ESLint, production dependency audit, production/security/auth/data-bridge/MCP checks, the new security-tool tests, the new tenant/business-owner tests, the platform-owner boundary test, and the production build.
- GitHub Actions on the same commit still report failure before any steps execute: the jobs report runner_id=0, an empty runner name, and no steps. That is not a code-test failure, but means GitHub Actions execution and real authentication DB E2E are not verified here.
- Production www.elitze.info still resolves to the deployed main commit, not the PR preview. Preview verification does not mean PR changes are live.

## Go-live blockers

### 1. Database-enforced tenant isolation — CRITICAL

The repository's database investigation report records zero RLS-enabled tables, zero FORCE RLS tables, zero RLS policies, and a custom login role with BYPASSRLS=true. It also notes that the active production database principal could not be confirmed and the available database-owner connection could not change the runtime role's RLS-bypass attribute.

Application-level tenantId filters and role checks are not a substitute for database-enforced isolation in a multi-business SaaS. Do not claim cross-customer isolation is proven until the deployment owner provisions a verifiable LOGIN NOBYPASSRLS application role with least-privilege grants, the application safely propagates trusted tenant context, each tenant-owned table has a reviewed RLS policy, and negative cross-tenant read/write/export tests pass. Do not switch on RLS indiscriminately without that preparation; it can break legitimate queries and create false confidence.

### 2. Platform-owner provisioning

Configure ELITZE_PLATFORM_OWNER_EMAILS through Vercel's server-side environment manager for the intended platform operator. The key is absent from the inspected environment list. The allowlist is intentionally fail-closed.

### 3. Production service credentials and real journey tests

Confirm real non-empty values in the secret manager for the production database connection, session/auth/encryption/signing keys, internal service key, email delivery key, and security runner HMAC key. The environment inspection did not establish valid usable values for all of these. Then run registration + verification, login/MFA, password recovery, business setup, invite/revoke/accept, membership-role permission tests and the authenticated console against a disposable test tenant/database. Avoid exposing or placing secret values into logs, source control, or this report.

### 4. External integrations

Provision and verify the Metasploit HTTPS bridge before marking Metasploit connected. Provision and probe all optional SIEM/SOAR, threat-intelligence, endpoint, cloud, NVIDIA NIM, analytics, or Google provider credentials individually. Connector code or the existence of an environment-variable name is not proof of connection.

### 5. CI infrastructure

Restore functioning GitHub-hosted runners or configure a supported runner pool so GitHub Actions can execute its steps and the isolated PostgreSQL authentication E2E. Keep the Vercel preview gate, but do not treat it as proof that a separately configured GitHub Actions workflow passed.

## Release decision

**Keep PR #141 out of production until blocker 1 is resolved and blocker 3's critical user/tenant flows are demonstrated with real disposable test accounts.** After those checks, re-run GitHub Actions and the Vercel release gates, then review and merge. Do not describe every optional integration as connected until it passes a provider-specific live probe or ingest test.
