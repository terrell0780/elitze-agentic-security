# Contributing

Thank you for helping improve ELITZE Agentic Security.

## Before changing code

- Work from the canonical repository: `terrell0780/elitze-agentic-security`.
- Open or update a focused pull request rather than making unrelated changes together.
- Read [SECURITY.md](SECURITY.md) and the [architecture and deployment manifest](docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md).
- Do not commit credentials, private keys, production database URLs, customer data, generated build caches, or deployment tokens.
- Confirm the intended scope before changing production configuration, database schemas, or authorization boundaries.

## Development setup

Use the repository's Node.js 24 runtime and npm lockfile:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run workspace-platform:self-test
npm run platform:readiness
npm run production-config:self-test
npm run runner:self-test
npm run runner:handshake-self-test
npm run runner:control-plane-handshake-self-test
npm run build
```

Run the checks relevant to your change before opening a pull request. Include any checks not run and why.

## Pull request expectations

- Keep each pull request focused and explain the user or security problem being addressed.
- Describe behavior changes, risks, configuration changes, migration requirements, and rollback considerations.
- Add or update tests for changed behavior.
- Update documentation and environment examples when interfaces or configuration change.
- Preserve existing authentication, authorization, tenant isolation, auditability, and execution-scope checks.
- Never present mocked or synthetic data as production evidence.
- Do not claim a live integration, scan, deployment, or security outcome without direct verification.
- Do not weaken or bypass required CI/release gates to obtain a green result.

## Security-sensitive changes

- Derive actor and tenant identity from trusted server-side authentication.
- Fail closed when authorization, scope, policy, or required evidence cannot be established.
- Require explicit authorization for active testing and keep execution within the approved scope and Rules of Engagement.
- Review destructive database migrations for data loss; preserve required records and verify the migration state.
- Report suspected vulnerabilities privately using the process in [SECURITY.md](SECURITY.md), not in a public issue.

## Commit messages

Use short, imperative messages with an optional scope, for example:

- `docs: clarify runner deployment requirements`
- `fix(auth): enforce tenant boundary on endpoint`
- `test(policy): cover denied execution path`
