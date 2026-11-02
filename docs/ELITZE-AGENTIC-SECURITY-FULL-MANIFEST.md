# ELITZE Agentic Security — Full Project Manifest

**Manifest regenerated:** 2026-10-30 (supersedes the 2026-10-27 export)  
**Repository:** https://github.com/terrell0780/elitze-agentic-security  
**Production:** https://www.elitze.info  
**Latest application commit documented and verified here:** `9279873` ("build: decouple production migration from deployment build").  
**Verified deployment state (2026-10-30):** Vercel serves all public routes with HTTP 200 on `www.elitze.info`; the application's own readiness contract (`/api/public/health`) currently returns **503 "unavailable"** — see Verification record.

> This is a source manifest and observed verification snapshot, not a claim that every advertised integration is live or that overall tenant isolation is verified.

## Product identity and purpose

Identity-aware security controls for AI agents, MCP servers, tools, and sensitive execution paths.

ELITZE is designed around agent/workload identity, tenant boundaries, policy evaluation, scoped execution, observation, retesting, and auditable evidence. SARA is the supervisory layer within ELITZE's security boundaries. Sentinel is an integrated security layer, not a separate product or independent authority.

### What ELITZE is and does

ELITZE is a multi-tenant, evidence-gated security operations platform (Next.js 16 + PostgreSQL). It discovers AI agents, MCP servers, tools, and identities connected to an environment; evaluates what those identities may do through a deterministic pre-execution policy engine with approval gates; investigates security signals with detection rules and an agentic SOC analysis path; manages vulnerability and exposure context (CVE, CISA KEV, EPSS, reachability); runs authorized, scope-bound security validation through a separately executed signed runner (Nmap, Metasploit observation, John the Ripper, Aircrack-ng evidence connectors); ingests external security events through the Data Bridge; and preserves every decision and observation in a hash-linked, tamper-evident audit ledger. Missing telemetry is reported as `UNKNOWN`, `UNMEASURABLE`, or `NOT VERIFIED` rather than filled with invented data — the platform's defining rule is that configuration alone is never presented as proof.

### Planned (designed, not yet production-verified)

- Database-enforced tenant isolation: RLS policies for all tenant-keyed tables, applied and negative-tested (migration `0033_rag_tenant_rls.sql` exists in the repository; RAG portion not verified as applied to production).
- Live runner handshake and connected email/provider workflows verified with authorized credentials.
- Live cross-tenant negative tests using real separate tenant identities.
- Backup/restore and customer-pilot evidence for compliance use.

## Technology and runtime

| Property | Value |
|---|---|
| Package | `elitze-agentic-security` |
| Version | `0.1.0` |
| Build name | `Elitze-Agentic-Security` |
| Framework | Next.js `16.4.3` |
| UI | React `19.2.6`, React DOM `19.2.6` |
| Language | TypeScript `5.9.3` |
| Database | PostgreSQL via `pg` `8.20.0` and Drizzle ORM `0.45.2` |
| Agent framework | LangChain Core `^1.2.17`; LangGraph `^1.4.21` |
| MCP | `@modelcontextprotocol/server` `2.4.0` |
| Node | `>=24` |
| npm | `>=10` |
| Repository | https://github.com/terrell0780/elitze-agentic-security.git |
| Homepage | https://www.elitze.info |

## Architecture and key boundaries

- **Control plane/orchestrator:** `src/lib/elitze-secure/elitze-agent.ts`; governed planning API at `src/app/api/elitze/route.ts`.
- **SARA supervisory layer:** assurance and review within ELITZE's identity, tenant, policy, approval, and evidence boundaries.
- **Sentinel security layer:** gateway, deterministic policy, enforcement, defense fabric, audit ledger, adapters, and controlled runner patterns.
- **MCP gateway:** signed workload tokens, deny-by-default upstream hostname allowlist, tool/server identity, tenant and session binding, replay protection, policy decisions, evidence recording. Execution defaults to off.
- **Security runner:** `runner/`; separate execution tier; must validate signed requests, explicit authorization/scope, target allowlists, safety limits, timeouts, and signed callbacks.
- **Agent workflows:** `src/lib/elitze-secure/agent-workflow.ts`; persisted state is not proof a live scheduler is running.
- **Data Bridge:** authenticated ingestion, observed signals, adapter capabilities, and integration health.
- **Security workspace:** Next.js App Router routes for authenticated operations, console views, specialist tools, FAQ, and how-to guidance. 46 public routes registered in `public/elitze-routes.json`.
- **Persistence:** PostgreSQL-backed state; 36 SQL migrations under `drizzle/`.
- **RAG:** tenant-scoped document/chunk indexing and retrieval; RLS migration `0033_rag_tenant_rls.sql` present in the repository, application to production not verified.

## Security and truth-state rules

- Treat the authenticated server-side identity and tenant as authoritative; client-provided tenant IDs are not authorization.
- Distinguish `IMPLEMENTED`, `CONFIGURED`, `CONNECTED`, and `VERIFIED`.
- Preserve uncertainty as `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`.
- Never fabricate telemetry, incidents, customers, metrics, scan results, certifications, or provider status.
- A successful build/self-test does not prove live integration health, production runner authorization, or cross-tenant isolation.
- Do not blanket-enable RLS without table-specific tenant semantics, valid policy behavior, and negative cross-tenant tests.

## Verification record — 2026-10-30 (independent full run at `9279873`, clean tree, Windows, Node 24.20.0)

| Gate | Observed result |
|---|---|
| `npm install` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (zero findings) |
| `npm test` (security self-test) | PASS |
| 12 targeted self-tests | 11 PASS; `chat:governance-self-test` fail-closed without `DATABASE_URL` (fresh-clone crash fixed in working tree) |
| `npm run build` incl. 8-gate prebuild | exit 0 |
| `npm audit` | 0 vulnerabilities (critical/high/moderate/low) |
| Live public routes (`/`, `/about`, `/platform`, `/docs`, `/faq`, `/login`, `/register`, `/control-room`, `/agentic-soc`, `/robots.txt`, `/sitemap.xml`, …) | HTTP 200; unknown routes 404 |
| Live security headers | match `next.config.ts` (CSP, HSTS preload, `X-Frame-Options: DENY`, nosniff, COOP/CORP) |
| Auth-gated surfaces (`/workspace`, `/console`, `/chat`) | correctly serve the login gate to anonymous visitors |
| `/api/public/health` | **503 "unavailable"** — the production readiness contract is currently red |

### Uncommitted fixes in the verification working tree (2026-10-30)

1. `src/app/api/soc/decisions/[id]/route.ts` — cross-tenant read closed: decision query and channel-membership check now scope by `session.tenantId` (previously any team member could read any tenant's decision + evidence by ID).
2. `scripts/chat-governance-self-test.mjs` — `.env.local` is now loaded only when present, so the test runs on fresh clones instead of crashing with ENOENT.

Both typecheck clean. They require commit and push to take effect.

## Production readiness snapshot

### Observed serving state (2026-10-30)
- All probed public routes serve HTTP 200; prerendered pages render from cache.
- The readiness contract reports 503 because one of the production requirements is not satisfied in the deployed environment. Required for `ok:true` (per `src/config/secrets-assert.ts` and `src/lib/database-verify.ts`): `ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE` (≥32 chars), `ELITZE_TEAM_SESSION_SECRET_ACTIVE` (≥32), `ELITZE_ALLOWED_ORIGINS`, `ELITZE_INTERNAL_API_KEY_ACTIVE` (≥16), `ELITZE_EMAIL_PROVIDER=resend`, `ELITZE_EMAIL_FROM`, `RESEND_API_KEY`, a reachable database, and **exact migration-ledger parity** between `drizzle/*.sql` and `_elitze_migrations` (missing or unexpected rows both fail). The failing item is identified in server logs under the `[ELITZE_READINESS]` fingerprint.

### Outstanding — do not mark complete
- Restore the production readiness gate to `ok:true` (resolve the failing secret/database/migration-parity item above).
- Commit and push the two working-tree fixes from the verification record.
- Apply and verify `drizzle/0033_rag_tenant_rls.sql` against the approved production database using the approved migration procedure.
- Verify RAG tenant isolation with two real tenant identities, including absent-context and cross-tenant negative tests.
- Implement and verify semantically correct RLS policies for **all** tenant-keyed tables.
- Run real auth/session, session-revocation, and tenant authorization checks.
- Verify a live authorized security-runner signed handshake.
- Verify configured email and external provider workflows with authorized credentials.
- Verify backup/restore and customer-pilot evidence where required.
- Restore or redirect the search-indexed `/sales` URL (currently HTTP 404 to crawlers).
- Add validation, rate limiting, or explicit demo-labelling to the unauthenticated stateless evaluator endpoints (`/api/security/gateway/decision`, `/api/security/enterprise`, `/api/secops/exposure-priority`, `/api/reo/*`).

The database catalog was previously observed with zero RLS-enabled tenant tables and no tenant policies; therefore full database-enforced tenant isolation is **not verified**.

## Public route manifest

The following routes are from `public/elitze-routes.json` (46 entries). This list is the public/product route manifest, not an exhaustive list of API endpoints or every source folder.

| Path | Title |
|---|---|
| `/` | Home |
| `/about` | About |
| `/accessibility` | Accessibility |
| `/adversary-emulation` | Adversary Emulation |
| `/agentic-soc` | Agentic SOC |
| `/chat` | Governed Chat |
| `/compare` | Compare |
| `/compliance` | Compliance |
| `/contact` | Contact |
| `/contributing` | Contributing |
| `/control-room` | Control Room |
| `/docs` | Documentation |
| `/faq` | FAQ |
| `/forgot-password` | Forgot Password |
| `/help` | Help |
| `/integrations` | Integrations |
| `/legal` | Legal |
| `/login` | Login |
| `/orchestration` | Orchestration |
| `/platform` | Platform |
| `/privacy` | Privacy |
| `/recursive-agents` | Recursive Agents |
| `/register` | Register |
| `/reo` | REO |
| `/reset-password` | Reset Password |
| `/search` | Search |
| `/security` | Security |
| `/security-disclosure` | Security Disclosure |
| `/terms` | Terms |
| `/threat-detection` | Threat Detection |
| `/use-cases` | Use Cases |
| `/workspace` | Workspace |
| `/console` | Command Center |
| `/console/adversary-emulation` | Adversary Emulation Console |
| `/console/agentic-soc` | Agentic SOC Console |
| `/console/analyst` | Autonomous SOC Analyst |
| `/console/integrations` | Connected Integrations |
| `/console/pentesting` | Pentesting |
| `/console/readiness` | Production Readiness |
| `/console/roi` | Security Value |
| `/console/skills` | Security Skills |
| `/console/threat-detection` | Runtime Threat Detection |
| `/console/vulnerabilities` | Vulnerability Intelligence |
| `/accept-invitation` | Accept Organization Invitation |
| `/console/organization` | Organization & Members |
| `/how-to` | Interactive How-to Guides |

## npm scripts — complete package manifest

These commands are taken from the repository's `package.json` at `9279873` (unchanged since the previous manifest export).

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `prebuild` | `npm run db:runtime-role:self-test && npm run mcp-upstream-address:self-test && npm run accessibility:contract-self-test && npm run security-tool-integrations:self-test && npm run tenant-security:self-test && npm run platform-owner:self-test && npm run database-isolation-readiness:self-test && npm run rag:self-test` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `node scripts/security-self-test.mjs` |
| `security:self-test` | `node scripts/security-self-test.mjs` |
| `threat-detection:self-test` | `node --experimental-strip-types scripts/threat-detection-self-test.mjs` |
| `data-bridge:self-test` | `node scripts/data-bridge-self-test.mjs` |
| `mcp-workload-identity:self-test` | `node scripts/mcp-workload-identity-self-test.mjs` |
| `mcp-upstream-address:self-test` | `node --experimental-strip-types scripts/mcp-upstream-address-self-test.mjs` |
| `policy-evidence:self-test` | `node scripts/policy-evidence-self-test.mjs` |
| `phase5-6:self-test` | `node scripts/phase5-6-self-test.mjs` |
| `global-compliance:self-test` | `node scripts/global-compliance-self-test.mjs` |
| `legal:control-self-test` | `node scripts/legal-control-self-test.mjs` |
| `verify:evidence` | `node scripts/verify-evidence.mjs` |
| `brand:self-test` | `node scripts/brand-self-test.mjs` |
| `licenses:inventory` | `node scripts/license-inventory.mjs` |
| `db:migrate` | `node scripts/migrate.mjs` |
| `db:config-self-test` | `node scripts/db-config-self-test.mjs` |
| `production-config:self-test` | `node scripts/production-config-self-test.mjs` |
| `database-isolation-readiness:self-test` | `node --experimental-strip-types scripts/database-isolation-readiness-self-test.mjs` |
| `health-observability:self-test` | `node --experimental-strip-types scripts/health-observability-self-test.mjs` |
| `tenant-overview:self-test` | `node scripts/tenant-overview-self-test.mjs` |
| `mcp:github` | `node src/lib/elitze-secure/github-control-mcp.mjs` |
| `auth:security-self-test` | `node scripts/auth-security-self-test.mjs` |
| `auth:e2e-safety-self-test` | `node --experimental-strip-types scripts/auth-e2e-safety-self-test.mjs` |
| `auth:e2e-self-test` | `node scripts/auth-e2e-self-test.mjs` |
| `progressive-proofing:self-test` | `node --experimental-strip-types scripts/progressive-proofing-self-test.mjs` |
| `evidence-expression:self-test` | `node --experimental-strip-types scripts/evidence-expression-self-test.mjs` |
| `pentest-request:self-test` | `node scripts/pentest-request-self-test.mjs` |
| `live-validation:self-test` | `node scripts/live-validation-self-test.mjs` |
| `security-tool-integrations:self-test` | `node --experimental-strip-types scripts/security-tool-integrations-self-test.mjs` |
| `tenant-security:self-test` | `node --experimental-strip-types scripts/tenant-security-self-test.mjs` |
| `runner:self-test` | `node runner/self-test.mjs` |
| `runner:handshake-self-test` | `node runner/handshake-integration-self-test.mjs` |
| `runner:control-plane-handshake-self-test` | `node --experimental-strip-types scripts/runner-control-plane-handshake-self-test.mjs` |
| `vulnerability-intelligence:self-test` | `node scripts/vulnerability-intelligence-self-test.mjs` |
| `security-fabric:self-test` | `node scripts/security-fabric-self-test.mjs` |
| `google-ads-governance:self-test` | `node scripts/google-ads-governance-self-test.mjs` |
| `rag:self-test` | `node scripts/rag-self-test.mjs` |
| `agent-workflow:self-test` | `node scripts/agent-workflow-self-test.mjs` |
| `trust-ownership:self-test` | `node scripts/trust-ownership-self-test.mjs` |
| `reo-market-intelligence:self-test` | `node scripts/reo-market-intelligence-self-test.mjs` |
| `db:production-migrate` | `node scripts/production-migrate.mjs` |
| `db:production-health` | `node scripts/production-db-health.mjs` |
| `braces:self-test` | `node scripts/braces-self-test.mjs` |
| `security-graph:self-test` | `node scripts/security-graph-self-test.mjs` |
| `chat:governance-self-test` | `node --experimental-strip-types scripts/chat-governance-self-test.mjs` |
| `diagnostics:manual-random` | `node scripts/diagnostics-manual-random.mjs` |
| `agent-passports:self-test` | `node --experimental-strip-types scripts/agent-passports-self-test.mjs` |
| `vulnerability-triage:self-test` | `node --experimental-strip-types scripts/vulnerability-triage-self-test.mjs` |
| `evidence-snapshot:self-test` | `node scripts/evidence-snapshot-self-test.mjs` |
| `platform:readiness` | `node scripts/security-self-test.mjs && node scripts/production-config-self-test.mjs && node scripts/brand-self-test.mjs` |
| `workspace-platform:self-test` | `node scripts/workspace-platform-self-test.mjs` |
| `accessibility:contract-self-test` | `node scripts/a11y-contract-self-test.mjs` |
| `platform-owner:self-test` | `node --experimental-strip-types scripts/platform-owner-self-test.mjs` |
| `db:runtime-role:self-test` | `node --experimental-strip-types scripts/db-runtime-role-self-test.mjs` |

## Production dependencies

| Package | Version range |
|---|---|
| `@langchain/core` | `^1.2.17` |
| `@langchain/langgraph` | `^1.4.21` |
| `@modelcontextprotocol/server` | `2.4.0` |
| `@node-saml/node-saml` | `5.1.0` |
| `@simplewebauthn/browser` | `14.0.0` |
| `@simplewebauthn/server` | `14.0.2` |
| `drizzle-orm` | `0.45.2` |
| `duck-duck-scrape` | `^2.2.7` |
| `lucide-react` | `^1.37.0` |
| `next` | `16.4.3` |
| `openid-client` | `6.8.8` |
| `pg` | `8.20.0` |
| `react` | `19.2.6` |
| `react-dom` | `19.2.6` |
| `zod` | `4.6.7` |

## Development dependencies

| Package | Version range |
|---|---|
| `@tailwindcss/postcss` | `4.1.17` |
| `@types/node` | `22.19.15` |
| `@types/pg` | `8.18.0` |
| `@types/react` | `19.2.14` |
| `@types/react-dom` | `19.2.3` |
| `drizzle-kit` | `0.31.10` |
| `eslint` | `10.13.0` |
| `eslint-config-next` | `16.4.3` |
| `fill-range` | `7.1.1` |
| `postcss` | `8.5.29` |
| `tailwindcss` | `4.1.17` |
| `typescript` | `5.9.3` |

## Repository metadata and source-of-truth files

- `README.md` — product overview, workflows, architecture, local setup, checks, and documentation index.
- `package.json` — scripts, dependency versions, engine requirements, overrides.
- `package-lock.json` — reproducible dependency lock.
- `public/elitze-routes.json` — public/product route manifest.
- `src/app/sitemap.ts` — sitemap generation.
- `.env.example` — documented environment configuration; never put secret values into the manifest.
- `TODO.md` — current product and security readiness checklist.
- `docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md` — architecture and deployment boundaries.
- `docs/ELITZE-AGENTIC-SECURITY-CHAT-AND-CONTEXT-EXPORT.md` — conversation excerpts and project context available to this export.
- `SECURITY.md` — security reporting.
- `CONTRIBUTING.md` — contribution instructions.
- `runner/` — separate runner implementation and tests.
- `drizzle/` — database migration sources (36 SQL migrations).
- `scripts/` — build gates and self-tests.

## Standard local setup

```bash
git clone https://github.com/terrell0780/elitze-agentic-security.git
cd elitze-agentic-security
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev
```

Use `.env.example` to configure the selected workflows. Do not point migrations at production without confirming the target and following the approved migration process.

## Release references

- Verified verification run record: 2026-10-30, this file, "Verification record" section.
- Current implementation HEAD: https://github.com/terrell0780/elitze-agentic-security/commit/9279873
- Previous documented implementation commit: https://github.com/terrell0780/elitze-agentic-security/commit/4ff816343cdb68e367d066c9847abb52d4e7ba16
- Previous interactive workspace change: https://github.com/terrell0780/elitze-agentic-security/commit/38ed09993e0ddad329ac911b21e1afa6e281e597
- Production: https://www.elitze.info
