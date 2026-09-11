# ELITZE Agentic Security — Buyer Due Diligence

## 1. Product identity

- Product: **ELITZE Agentic Security**
- Repository: `terrell0780/elitze-agentic-security`
- Canonical domain referenced by the project: `elitze.ca`
- Default repository branch: `main`

## 2. Code and build review

Buyer should verify:

- Repository history and contributors.
- Current default branch.
- Build instructions.
- Package/dependency inventory.
- Database schema and migrations.
- Test suite and test results.
- Typecheck/lint/build results.
- Known defects and blockers.
- Third-party dependencies and licenses.

## 3. Runtime review

Verify in a buyer-controlled environment:

- Application starts successfully.
- Database connection works.
- Migrations apply successfully.
- `/api/health` reports the expected readiness state.
- Authentication and authorization operate as intended.
- Security-decision API rejects unauthorized requests.
- Kill-switch behavior matches the documented fail-closed model.
- Empty-data state does not fabricate telemetry.

## 4. Security review

Buyer should review:

- Authentication and session handling.
- Authorization boundaries.
- Secret handling.
- API input validation.
- Database access controls.
- Tenant isolation.
- Logging and audit behavior.
- Dependency vulnerabilities.
- CI/CD controls.
- Runtime containment configuration.

## 5. Commercial review

Revenue, customers, contracts, traffic, retention, valuation, certifications, regulatory status, security attestations, and production performance should be treated as **unverified unless supporting evidence is provided separately**.

## 6. Asset-transfer review

The transaction should explicitly state whether it includes:

- Source code/IP.
- Domain.
- Brand/trademarks.
- Infrastructure.
- Deployment configuration.
- Cloud accounts.
- Database/data.
- Customer contracts.
- Third-party accounts.
- Documentation.
- Support/handoff period.

## 7. Evidence rule

A buyer should prefer reproducible evidence over screenshots or verbal claims. Production status should be independently verified before closing.
