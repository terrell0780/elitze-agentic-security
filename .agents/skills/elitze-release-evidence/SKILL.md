---
name: elitze-release-evidence
description: Verify ELITZE release gates, migrations, authentication E2E, SBOM and licenses, runner handshake, rollback, and buyer handoff evidence.
---

# ELITZE Release Evidence

## Candidate baseline
- Record the exact candidate commit SHA and lockfile.
- Inspect PR review state, merge conflicts, required checks and branch/base relationship.
- Check the actual workflow run on the candidate SHA. A configured workflow is not a green result.
- Retain test, audit, migration, auth E2E, SBOM, and runner-handshake links/artifacts.

## Relevant checks
Run only when prerequisites are available:
- `npm ci`
- `npm audit --omit=dev --audit-level=high`
- `npm run db:config-self-test`
- `npm run production-config:self-test`
- `npm run security:self-test`
- `npm run auth:security-self-test`
- `npm run data-bridge:self-test`
- `npm run mcp-workload-identity:self-test`
- `npm run mcp-upstream-address:self-test` (when present on the candidate)
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run auth:e2e-safety-self-test`
- `npm run auth:e2e-self-test`
- Generate and retain the CycloneDX SBOM and license inventory.

Do not run migrations, destructive actions, or live-provider tests against production without explicit authorization and a rollback plan.

## Release gates
- Real production secrets are set in the secret manager and validated without disclosure.
- Target-database migration and health checks succeed.
- Required CI checks pass on the exact candidate commit.
- Signed runner challenge-response is verified for release validation. A PR run that skips this is not production approval.
- Rollback, restore, and post-deploy health steps exist.
- Each live provider has separately verified integration evidence and a truthful status.

## Handoff
Deliver a source/commit manifest, lockfile, SBOM, license inventory, architecture and deployment docs, migration/restore runbook, sanitized integration matrix, CI/test links, verified ownership documents, and buyer-controlled credential rotation procedure. Never transfer secrets through source control or assert IP title without supporting documentation.
