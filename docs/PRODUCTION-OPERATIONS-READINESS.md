# ELITZE Production Operations Readiness

This checklist describes the evidence required to verify a production ELITZE Agentic Security deployment. It does not state that a dependency, integration, or security control is operational merely because code or configuration exists.

## Required operating dependencies

- **Database:** PostgreSQL/Neon is reachable; approved migrations are applied; schema and connection health are verified.
- **Authentication:** signup, email verification, login, recovery, logout, session revocation, MFA/passkey paths where enabled, and origin controls are tested.
- **Email:** the configured provider is Resend; sender/domain verification and delivery are confirmed with a real test message.
- **Security integrations:** each provider has an explicit authorized scope, stored credentials, authenticated probe, and attributable observed records.
- **Runner:** health and signed challenge-response pass; target allowlists, authorization, timeout, audit, and failure-closed behavior are verified.
- **Monitoring:** service health and failures are collected without exposing internal configuration in public responses.
- **Backups and recovery:** backup completion and restore testing are recorded for the intended environment.
- **Evidence:** security decisions, execution outcomes, and retest results are tied to tenant, identity, timestamp, source, and provenance.

## Evidence rules

- Report a control as verified only after the specific test or live check has executed and its result is recorded.
- Distinguish `IMPLEMENTED`, `CONFIGURED`, `CONNECTED`, and `VERIFIED`.
- Preserve `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH` when proof is absent.
- Never seed fake telemetry, findings, identities, integrations, or positive health results.
- Never commit database URLs, credentials, customer records, or provider secrets to source control.

## Verification order

1. Confirm the repository, branch, exact commit SHA, and deployed revision.
2. Run `npm ci`, typecheck, lint, production build, dependency audit, and applicable security self-tests.
3. Verify the migration state against the explicitly approved database without resetting or destructively changing production data.
4. Verify authentication and tenant isolation using disposable test identities and a separate test tenant.
5. Verify runner health and authenticated signed handshake.
6. Probe each authorized provider and retain source-attributed results.
7. Confirm recovery/rollback readiness and capture sanitized evidence for each completed check.

A passing static test is not a substitute for a live production verification. An edge checkpoint that prevents a probe from inspecting the application must be recorded as `UNMEASURABLE`, not as a clean result.
