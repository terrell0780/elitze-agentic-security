# ELITZE Agentic Security — Handoff Manifest

Generated: 2026-09-21
Repository: `terrell0780/elitze-agentic-security`
Branch: `arena/01a0baa3-elitze-agentic-security`

## Handoff objective

Continue building ELITZE as a premium, frontier-grade cybersecurity operating platform. Preserve existing work. Do not replace useful capabilities. The product must be buyer-ready, mobile-friendly, visually polished, secure, honest about implementation state, and deployable on the user's actual hosting environment.

## Non-negotiable product requirements

- Product brand: **ELITZE**.
- Globe and search capability name: **ELITZE Global Security**.
- No legacy product naming in user-facing UI, active source identifiers, URLs, docs, or assets.
- Existing useful security functions must be preserved.
- Landing page must be concise and product-led, not a book.
- Long readable explanations belong in About/Resources/menu tabs.
- Interactions belong on dedicated product pages.
- Visual quality should target leading cybersecurity platforms: animated globe, graphs, scans, identity, agent reach, policy, evidence, cloud, API, data, and incident surfaces.
- Mobile-first and accessible.
- No fabricated telemetry. Use `UNKNOWN`, `UNAVAILABLE`, `BLOCKED`, `UNSCANNED`, or `INCONCLUSIVE` when appropriate.
- Camera support must be limited to organization-owned or explicitly authorized connectors. Never discover or access arbitrary third-party cameras.
- 24/7 operation means scheduled/continuous authorized monitoring, not uncontrolled attacks.
- User-help rule: always provide a useful, safe, honest next action.

## Platformisation target

ELITZE is intended to become one cohesive security operating platform rather than disconnected tools:

1. Shared data fabric for endpoint, network, cloud, identity, email, agent, API, data, threat, vulnerability, policy, incident, and evidence telemetry.
2. Unified normalized event schema and cross-domain correlation.
3. Single command surface and asset inventory.
4. Shared identity-aware policy engine.
5. Native XDR-style correlation and governed cross-domain response.
6. Open API/webhook/integration ecosystem.
7. Evidence provenance and audit trails for every decision.
8. Connector health, permissions, freshness, and tenant isolation.
9. TCO/consolidation claims only when supported by customer-specific evidence.

## Repository work completed

### Branding and globe

- Added `src/components/elitze-global-security.tsx` as the active globe.
- Removed old globe files:
  - `src/components/gods-eye-globe.tsx`
  - `src/components/elitze-global-security-view.tsx`
- Rebranded UI to `ELITZE Global Security`.
- Added animated globe treatment, orbital rings, domain nodes, layer selection, drag, wheel zoom, reset, scan animation, authorized-source camera panel, and honest telemetry states.
- Active source code no longer uses the old globe naming.
- Physical legacy database naming was replaced in active code with `external_visibility_findings` and `externalVisibilityFindings`; historical migrations may retain old identifiers for migration integrity.

### Function inventory and status model

- Added `src/lib/elitze-secure/function-inventory.ts`.
- Added `src/lib/elitze-secure/function-inventory-server.ts`.
- Added `src/app/api/security/functions/route.ts`.
- Added `src/app/console/functions/page.tsx`.
- Added `src/components/function-inventory-explorer.tsx`.
- Added `scripts/function-inventory-self-test.mjs`.
- Inventory contains 165 functions.
- Current self-test result previously verified:
  - verified: 77
  - partial: 30
  - blocked: 30
  - planned: 28
  - unsupported claims: 0
- Artifact existence is resolved at build time using `src/lib/elitze-secure/function-manifest.generated.json`.
- Runtime configuration remains environment-dependent.
- Added `scripts/generate-function-manifest.mjs` and `prebuild` hook.

### Capability consistency

- `/api/security/capabilities` now derives from the same function inventory as `/api/security/functions`.
- It no longer uses the contradictory hand-maintained capability status response.
- Commit containing this change: `f2e780f`.

### Security hardening

- Added request body validation helpers in `src/lib/http/request-body.ts`.
- Added rate limiting in `src/lib/http/rate-limit.ts`.
- Hardened several routes against malformed JSON and fail-open behavior.
- Added/updated CSP, security headers, API no-store behavior, and related configuration in `next.config.ts`.
- Added `scripts/check-audit.mjs`.
- Added CI production gate updates.

### Database

- Added `drizzle/0019_rebrand_external_visibility.sql` for the in-place table rename.
- Existing schema and migrations must be reviewed before running in production.
- Database-backed features require configured database credentials.

## Verification previously achieved

- TypeScript passed.
- Production build passed.
- Build filesystem tracing warning was eliminated.
- Function inventory self-test passed.
- Brand self-test passed for 251 scanned text files.
- Security/data/MCP/policy/phase/function/brand/readiness gates previously passed.
- `npm run lint` previously passed with 0 errors and 5 warnings.

## Git state and commits

Important: earlier session operations created confusing divergent local/remote history and some work was consolidated with force-pushes. Verify `git status`, `git log`, and the remote branch before modifying history.

Known commits:

- `cd35b97` — initial ELITZE Global Security rebrand/consolidation.
- `5f29c4c` — animated 3D authorized scan surface.
- `7547b11` — branding cleanup and large remediation consolidation.
- `f2e780f` — capability status derived from verified function inventory.
- `f0ffe96` — consolidated verified security platform foundation.
- `4ef3e27` — Arena live-preview origin configuration.
- `24f2b12` — initial PHP shared-fabric platform stage.
- `b254b1f` — included an upload archive in the repository.

The current branch must be inspected before assuming it is clean. Do not delete the repository root or `.git` directory.

## IONOS deployment facts

The user has IONOS Web Hosting Plus/Ultimate Webspace with:

- Webspace
- SFTP
- Databases
- PHP
- Cron jobs
- CDN

The panel did not show a Node.js application runtime.

The domain `elitze.ca` was connected to IONOS Webspace and the allowed folder was `/public`.

The user wants the complete application, not a static landing page. Do not present a static-only package as the complete product.

The existing application requires a server runtime, APIs, authentication, database access, scheduled work, and security modules. A true IONOS-native rebuild therefore needs to be implemented and tested as a separate PHP/MySQL application while preserving the existing source.

## IONOS-native work currently staged

Directory:

```text
ionos-elitze-platform/
```

Contains an initial PHP shared-fabric stage:

- `config.php`
- `lib/platform.php`
- `public/index.php`
- `public/assets.css`
- `public/.htaccess`
- `public/api/health.php`
- `public/api/ingest.php`
- `cron/cleanup.php`
- `README-UPLOAD.txt`

A self-contained single-folder variant was also created:

```text
ionos-elitze-public/
```

Archive:

```text
ELITZE-IONOS-PUBLIC.zip
```

This is **not yet a complete production replacement**. It is an initial PHP shared-fabric stage with:

- `flock()` platform locking
- atomic JSON state writes
- JSONL audit events
- authenticated ingress using `X-ELITZE-INGRESS-KEY`
- event IDs and duplicate protection
- request-size validation
- normalized signals
- basic multi-vector scoring
- review findings
- cleanup cron
- health endpoint
- mobile landing surface

The environment did not have the PHP CLI, so PHP syntax was not locally verified. A real handoff agent must run PHP lint/tests on PHP 8+ before deployment.

## Required next implementation work

### IONOS application

1. Choose one canonical IONOS layout. Prefer the self-contained `/public` package if the hosting account restricts access outside the web root.
2. Verify PHP version and available extensions on IONOS.
3. Add a real environment/config mechanism; never commit ingress keys or database passwords.
4. Add MySQL/MariaDB schema and migration runner.
5. Replace flat-file-only state with database-backed durable records for production while retaining lock/atomic protections where needed.
6. Add tenant and user tables, sessions, password hashing, lockout, CSRF protection, and role-based authorization.
7. Port the required security APIs into PHP routes.
8. Add policy, evidence, audit, connector, asset, signal, incident, and response tables.
9. Add cron-safe workers for source refresh, vulnerability intake, telemetry normalization, cleanup, and integrity checks.
10. Add PHP lint, integration tests, health checks, and a deploy verification script.
11. Test with the actual IONOS PHP runtime before calling the package deployable.

### Security requirements

- Ingress must use HTTPS, source authentication, replay protection, schema validation, rate limiting, size limits, idempotency, audit logging, and tenant isolation.
- Automated containment must never run solely because an external POST requests it.
- High-impact actions require policy authorization and, where configured, human approval.
- Risk threshold semantics must be explicit: high risk crosses a threshold; do not use ambiguous “risk drops” language.
- Preserve evidence for open incidents; cleanup must only remove expired telemetry according to retention policy.
- Use atomic state replacement and `flock()` if file state remains.
- Never claim a source was scanned if it was unavailable.

### Landing/product UX

- Main landing page: concise sales surface, not long documentation.
- Put detailed readable text in menu tabs/About/Resources.
- Put interactions on dedicated product pages.
- Rework all imagery to ELITZE-specific cybersecurity visuals.
- Maintain animated globe, graphs, scans, security relationships, identity, agent reach, policy, evidence, cloud, API, data, and authorized connectors.
- Audit desktop, tablet, and mobile layouts.

### Continuous security

Implement authorized recurring checks for:

- Dependency CVEs
- Source vulnerabilities
- Secrets
- Auth/session logic
- API validation
- SSRF/SSRF-like outbound requests
- XSS/CSRF/injection
- Path traversal and uploads
- Rate limits
- Security headers/CSP
- Database/migrations
- Cron workers
- CI/CD and deployment configuration
- Third-party connectors
- Public assets and metadata

Every scan must report one of:

```text
CLEAN
FINDINGS
BLOCKED
UNSCANNED
INCONCLUSIVE
```

Never turn unavailable audit metadata into a clean result.

## Immediate takeover commands

```bash
cd /home/user/elitze-agentic-security
git status -sb
git log --oneline --decorate -12
npm ci
npm run typecheck
npm run build
npm run functions:self-test
npm run brand:self-test
```

For PHP staging, use PHP 8+ locally or on a test server:

```bash
find ionos-elitze-platform ionos-elitze-public -name '*.php' -print0 | xargs -0 -n1 php -l
```

## Do not repeat prior mistakes

- Do not tell the user the ZIP is production-ready without PHP runtime testing.
- Do not tell the user a folder connection deploys the app automatically.
- Do not upload raw repository source as a working IONOS deployment.
- Do not claim 24/7 agents or pentesting without a running scheduler and verified connectors.
- Do not claim “all CVEs scanned” when advisory metadata is unavailable.
- Do not use arbitrary camera discovery or unauthorized feeds.
- Do not use `git stash --include-untracked` in this repository.
- Do not request or store the user's hosting passwords, SFTP credentials, API keys, or tokens.

## User's current expectation

The user wants a real, sellable, end-to-end ELITZE security platform, not a static mockup, source ZIP, or documentation-only result. The next agent should be direct, avoid repeated hosting explanations, preserve existing work, and only call a deployment complete after testing it on the actual target runtime.
