# Contributing to ELITZE Agentic Security

## Development setup

1. Use the repository's supported Node.js version and install the lockfile-pinned dependencies with npm ci.
2. Configure local environment variables for local services only. Do not copy production secrets into development.
3. Use a disposable local PostgreSQL database for authentication and end-to-end tests. The auth E2E test deliberately refuses non-loopback databases and requires ELITZE_AUTH_E2E_DISPOSABLE_DB=true plus a database name explicitly marked ci, test, or e2e.
4. Run the focused self-test, npm run lint, npm run typecheck, npm audit --audit-level=high, npm run public-exposure:self-test, and npm run build.

## Security and evidence requirements

- Do not introduce seeded demo/fixture telemetry into production routes or tenant tables.
- Unit tests may use fixtures only inside test files or a dedicated disposable database.
- Only source-observed events may create source-backed detections.
- Preserve connector ID, event/record ID, source reference, observed timestamp and original evidence state.
- Never mark an integration CONNECTED merely because its URL, credential or code adapter exists.
- Keep unavailable data UNMEASURABLE; incomplete claims UNKNOWN; insufficient path evidence INSUFFICIENT_REACH.
- Do not attach automatic remediation or arbitrary command execution to model output.
- Keep runner authorization, hostname/port allowlists, private-address blocking, signed callback verification and unexpired RoE enforcement intact.
- Never expose secrets, decrypted provider tokens, private tenant notes or full sensitive payloads in public APIs, logs, screenshots or markdown metadata.

## Change procedure

1. Implement a focused change and add tests for expected and rejected inputs.
2. Run the self-tests plus lint, typecheck, dependency audit and production build.
3. Review git diff --check and git status for generated files/secrets.
4. Push changes for automated validation. Do not promote a production release unless all required CI/release gates pass and the relevant live integration probes are green.
5. Update this documentation when the external APIs, authorization boundary or source-of-truth changes.

## How to help

Contributions are useful in: connector-specific live probes; tenant-isolation testing; deterministic threat-detection rules with verified source contracts; ATT&CK technique mapping; accessibility and keyboard/3D controls; SEO metadata tests; Obsidian vault note linking; and recovery/backup, runner and incident-response drills.

Open an issue or proposed change with the affected workflow, source contract, risk, test strategy and evidence used to validate the result.
