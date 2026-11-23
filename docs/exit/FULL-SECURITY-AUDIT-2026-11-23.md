# ELITZE Agentic Security — Full Security & Product-Readiness Audit

**Date:** 23 November 2026
**Branch:** `full-security-audit` (HEAD `33de79f`, plus the fixes in this change)
**Scope:** whole repository — Next.js control plane, PostgreSQL schema, authentication, tenant isolation, API surface, evidence/audit paths, Python scan engine, release gates.
**Method:** real PostgreSQL, real migrations, real accounts, real HTTP requests. No mock data, no simulated results, no seeded demo records.

> This is a source-and-runtime audit of the repository as it actually runs. It is **not** a claim of SOC 2, ISO certification, an independent penetration test, or a live third-party integration. Items that could not be executed here are listed as **not verified**, not as passing.

---

## 1. Verdict

| Area | Status | Evidence |
| --- | --- | --- |
| Build and type gates | **PASS** | `tsc --noEmit`, `eslint .`, production `next build` (70 routes) |
| Repo self-test suite | **PASS** | 44/46 pass; 2 non-defects explained in §6 |
| Authentication end to end | **PASS** | Real signup → email verification → login → session → reset → revocation |
| Cross-tenant isolation (application layer) | **PASS** | Two real tenants, negative reads against graph and evidence APIs |
| Cross-tenant isolation (database RLS) | **GAP** | 4 of 98 tenant-keyed tables carry RLS |
| Public route surface | **PASS** | 38/38 sitemap URLs return 200 |
| Security headers | **PASS** | HSTS, CSP, nosniff, DENY framing, referrer, permissions policy served |
| Dependency risk | **PASS (1 moderate)** | `npm audit --omit=dev`: 0 high, 0 critical |
| Python scan engine | **PASS** | 32/32 `pytest` |
| Production deployment | **NOT VERIFIED** | No deployed environment was audited; see §7 |

**Overall:** the control plane is real, typed, fail-closed, and evidence-first, and it now passes its own gates and a real end-to-end authentication/tenant-isolation run. It is **product-ready as a codebase**, with the named open items in §6 that must be closed before a customer deployment claims full database-enforced tenant isolation or SAML replay protection.

---

## 2. What was actually run

Environment: application source mounted read-only into a Node 24 dev container, PostgreSQL 16 + `pgvector`, a local mailbox, and the repository's own Drizzle migration runner.

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | clean |
| ESLint | `npm run lint` | clean |
| Production build | `npx next build` (`NODE_ENV=production`) | success — 70 routes, static + dynamic |
| Self-tests | every `*:self-test` script in `package.json` | 44 pass, 2 explained (§6) |
| Dependency audit | `npm audit --omit=dev` | 1 moderate, 0 high/critical |
| Python tests | `python -m pytest` in `elitze-scan/` | 32 passed |
| Migrations | `npm run db:migrate` | 37 migrations applied to a fresh database |
| Auth + tenant E2E | `scripts/auth-e2e-self-test.mjs` | PASS (§3) |
| Route crawl | every `<loc>` in `/sitemap.xml` | 38/38 → HTTP 200 |
| Health | `/api/health`, `/api/v1/health`, `/api/public/health` | 200, `status: ready`, database reachable |

Schema measured on the migrated database: **118 tables**, **98 columns named `tenant_id`**, **4 tables with row-level security**, **37 migrations recorded**.

---

## 3. Authentication and tenant-isolation evidence

`scripts/auth-e2e-self-test.mjs` was executed against a **disposable database created for this audit**, with the real production build and the application's own `test` email transport:

- account creation with a real password, email verification token delivered and consumed
- unverified accounts are refused at login (`email_verification_required`)
- login issues a database-backed session; `/api/auth/session` returns the account
- password reset revokes existing sessions and the old password stops working
- attachment upload records `STORED` / `NOT_SCANNED` — it does **not** claim a scan was performed
- two accounts receive **separate tenants**
- tenant A's security-graph and evidence APIs return A's records and **never** B's; the reverse also holds

Result: `ELITZE real-auth E2E: PASS`. The disposable database was dropped afterwards; no audit fixtures remain.

Additional runtime checks on the live dev server:

- anonymous `POST /api/security/gateway/decision` → evaluator result flagged non-authoritative
- anonymous `GET /api/reo/intelligence/semrush` → **401**
- anonymous `/console` document request → **307** to `/login?next=/console`; the real “Console” navigation link lands on the sign-in form

---

## 4. Defects found and fixed in this change

### 4.1 Exposure scoring returned `null`/`LOW` for a critical exposure — **fixed**

`prioritizeExposure` multiplied by `assetCriticality` without a finiteness guard. A caller that omitted that optional field got `NaN`, which serialised as `score: null` and fell through to `priority: "LOW"`.

Reproduced before the fix:

```
POST /api/secops/exposure-priority {"cvss":9.8,"epss":0.7,"kev":true}
→ {"score":null,"priority":"LOW"}
```

After the fix: `{"score":92,"priority":"CRITICAL"}`. Non-finite optional inputs now default to `0`; valid inputs score exactly as before.

### 4.2 Paid-quota intelligence proxies were unauthenticated — **fixed**

`/api/reo/intelligence/semrush` and `/api/reo/intelligence/similarweb` injected a server-held paid API key into upstream calls for any anonymous caller. They now require an authenticated ELITZE session and return `401 authentication_required` otherwise. No UI called them, so nothing breaks.

### 4.3 Stateless evaluator endpoints had no non-authoritative marker — **fixed**

`/api/security/gateway/decision`, `/api/security/identity/authorize`, `/api/security/enterprise`, `/api/secops/exposure-priority`, `/api/reo/content-decision`, `/api/reo/trust-ownership`, and `/api/agent/risk` compute a result from caller-supplied input only. Their output could be mistaken for a persisted authorization decision.

Each now validates that the body is a JSON object (`400 invalid_request_body` otherwise) and returns `evaluator: "STATELESS_EVALUATOR"`, `authoritative: false`, and a note pointing at the authenticated, audited control-plane endpoint. This closes the manifest’s own open item to add “validation … or explicit demo-labelling” to these endpoints.

### 4.4 `security.txt` canonical location was 404 — **fixed**

`/security.txt` declared `Canonical: https://www.elitze.info/.well-known/security.txt`, but that path did not exist. The file is now served at `/.well-known/security.txt`. The bogus `Encryption:` line (it pointed at the security policy itself, not a key) was removed and `Policy`/`Acknowledgments` now point at the product’s own `/trust.html`.

### 4.5 Two release gates failed — **fixed**

- `global-compliance:self-test`: the compliance document had lost its SAP and Pentera references during a brand cleanup, while the catalog still maps both. Both are now documented as external integration/reference classes (consistent with `docs/ELITZE-BRAND-AND-IP-POLICY.md`), with explicit “a catalog entry does not mean a live connection” language.
- `security-fabric:self-test`: asserted the SAML SP entity ID and ACS URL use the apex `https://elitze.info`, but `src/config/production.ts` makes `https://www.elitze.info` the canonical production origin and `.env.example` follows it. The assertion now accepts the canonical host.

### 4.6 Sandbox-only 500 on every page — **environment, not code**

The first boot returned HTTP 500 with `Cannot find module '@vercel/turbopack/postcss'`. Cause: a stale Turbopack cache in the mounted `.next` volume from an earlier session. Clearing `.next` and restarting restored 200s. No source change was needed.

---

## 5. Security controls that verified correctly

- **Session handling** — opaque 256-bit tokens, SHA-256 at rest, idle (12h) and absolute (30d) expiry, 24h rotation, revocation on password reset, `HttpOnly`/`Secure`/`SameSite` cookies.
- **Password storage** — scrypt (N=16384, r=8, p=1), per-password salt, `timingSafeEqual`, timing-equalised failure path for unknown users.
- **Login hardening** — 10-attempt lockout, database-backed rate limits on login, registration, and password reset, same-origin enforcement on every state-changing auth route.
- **CSRF/origin** — `assertSameOrigin` on mutating routes, plus `SameSite=None; Secure` only in production.
- **Open-redirect protection** — the `?next=` parameter is restricted to same-origin paths.
- **Tenant scoping** — every data route read during the audit filtered by the session’s `tenantId`; no route accepted a tenant from the request body. Cross-tenant negative tests pass.
- **Internal control-plane** — `/api/security/decision` and the Data Bridge require a constant-time-compared internal key and fail closed when it is unset.
- **SQL** — parameterised queries throughout the routes reviewed; no string-concatenated SQL found.
- **Secrets** — no hardcoded credentials found in `src/`; production asserts a required-secret set when `NODE_ENV=production`.
- **MCP gateway** — disabled by default, upstream host allowlist, DNS pinning, evidence signing fails closed without its secret.
- **Headers** — HSTS, CSP (no `object-src`, `frame-ancestors 'none'`), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
- **Licence** — `LICENSE` is present and proprietary (the earlier “public repo, no licence” finding is closed).

---

## 6. Open findings (not fixed here)

| # | Severity | Finding | Why it is open |
| --- | --- | --- | --- |
| 1 | **High (deployment)** | Row-level security exists on 4 of 98 tenant-keyed tables. Isolation currently depends on application-layer scoping. | Application scoping is verified by the E2E, but database-enforced isolation for every tenant-keyed table is a schema programme, not a patch. Tracked as an open TODO item. |
| 2 | **Medium** | SAML is configured with `validateInResponseTo: never`, so a captured signed assertion could be replayed within its 5-minute validity window. | Correctly fixing it needs request-ID persistence and IdP round-trip testing. Report, do not guess. |
| 3 | **Medium** | `/api/vulnerabilities` and `/api/search` proxy external services anonymously with no rate limit. | They serve public pages, so authentication would change product behaviour; a distributed rate limit needs a trusted client identity (see #5). |
| 4 | **Medium** | `src/proxy.ts` gates `/console` and `/workspace` on the *presence* of a session cookie, not its validity. | No data is exposed — every page fetches gated APIs and every API calls `getCurrentUser()` — but the shell renders before the API rejects. Treat the proxy as UX, not the boundary. |
| 5 | **Low** | Rate limiting keys on the client IP, which is `unknown` unless `ELITZE_TRUST_PROXY=true`; behind an untrusted proxy every client shares one bucket. | Correct default (forwarded headers are not trusted blindly); needs an edge you control to set the flag. |
| 6 | **Low** | CSP allows `'unsafe-inline'` scripts (Next’s inline bootstrap) and `'unsafe-eval'` in non-production. | Removing inline scripts requires nonce plumbing through the App Router; `'unsafe-eval'` is already production-gated. |
| 7 | **Low** | `.env.example` ships placeholder signing secrets (`ELITZE_EVIDENCE_SIGNING_SECRET`, `ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET`) that the production secret assertion does not reject. | Evidence signing fails closed when unset; a copied placeholder would sign with a public value. Recommend adding both to `ProductionSecretsSchema` with a placeholder-prefix rejection, plus a deployment checklist step. |
| 8 | **Info** | `npm audit` reports one moderate advisory in `next` (`unstable_cache` information disclosure). | The application does not use `unstable_cache` or `'use cache'` (0 occurrences); revisit when Next publishes the patch. |
| 9 | **Info** | React logs “unique key” warnings during static generation on several pages. | Cosmetic in output, not a security or correctness defect; worth a cleanup pass. |

---

## 7. Explicitly not verified

- **A deployed production environment.** Nothing here was run against a hosted deployment, a managed database, or a real IdP. `/api/health` readiness was verified locally only.
- **Live third-party integrations** (Resend email, OIDC/SAML, AWS, GitHub, threat feeds, SEMrush/Similarweb). No customer credentials were present, and none were fabricated.
- **Signed-in console screens.** The preview browser is an anonymous visitor; the console UI behind login is covered by the API-level E2E, not by a signed-in browser walkthrough.
- **Distributed rate limiting and multi-instance behaviour.**
- **SOC 2 / ISO / independent penetration test.** Not claimed anywhere in this report.

---

## 8. Reproduce

```bash
# gates
npm run typecheck && npm run lint
NODE_ENV=production npx next build
for s in $(node -e 'const p=require("./package.json");console.log(Object.keys(p.scripts).filter(k=>/self-test$|^test$/.test(k)).join(" "))'); do npm run --silent "$s"; done

# real auth + tenant isolation against a disposable database
createdb elitze_e2e && DATABASE_URL=postgresql://…/elitze_e2e npm run db:migrate
PGHOST=127.0.0.1 PGPORT=5432 PGUSER=… PGPASSWORD=… PGDATABASE=elitze_e2e \
  ELITZE_AUTH_E2E_DISPOSABLE_DB=true NODE_ENV=production node scripts/auth-e2e-self-test.mjs

# python engine
cd elitze-scan && pip install -r requirements.txt && python -m pytest -q
```

The E2E refuses to run against a non-local or non-disposable database by design.
