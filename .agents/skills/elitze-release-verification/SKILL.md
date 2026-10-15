---
name: elitze-release-verification
description: Verify ELITZE release readiness using exact commit identity, CI checks, migrations, runtime health, deployment metadata, and explicit live-integration evidence.
---

# ELITZE Release Verification

Use this skill before calling an ELITZE change ready for release or describing it as operational.

## Release checks

1. Record the exact repository, branch, commit SHA, PR, and target environment.
2. Confirm that the current commit has passing required CI jobs for typecheck, lint, build, automated tests, relevant security self-tests, dependency audit, configuration checks, database migration/schema verification, authentication tests, tenant-isolation tests, and SBOM generation where configured.
3. Confirm that migration steps are versioned, ordered, repeatable where required, and tested against a disposable database. Never run a schema push or migration against production as an improvised test.
4. Check secrets/configuration by key presence and safe metadata only. Never copy secret values into notes, logs, or PR comments.
5. Separate deployment state from application health. A READY deployment is not proof that public routes, authenticated workflows, database access, or provider integrations work.
6. Check public health for minimal status and authenticated diagnostics separately; ensure public responses do not expose database details, secret configuration, migration names, or internal stack traces.
7. Verify external integrations individually through authorized live probes and persisted source-specific evidence. An adapter, environment variable, mocked test, or public feed response alone is insufficient.
8. Validate failure behavior: missing credentials, upstream timeouts, invalid provider responses, denied authorization, and unavailable evidence must not turn into success.
9. Record observed outputs and links with timestamps. Label anything not actually tested as unverified, unknown, or unmeasurable.
10. Recheck the final commit after any edits; do not rely on CI results from a different SHA.

## Release boundary

Do not claim certification, independent penetration testing, customer outcomes, or full provider coverage without separate evidence. Do not clean production records or alter production configuration without explicit scope and authorization. Do not deploy to production unless the user explicitly authorizes the deployment.
