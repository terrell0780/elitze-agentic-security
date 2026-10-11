# ELITZE Agentic Security — Buyer Due Diligence

## 1. Product identity

- Product: **ELITZE Agentic Security**
- Canonical domain: `elitze.info`
- Repository: private GitHub repository, disclosed to qualified buyers during diligence
- Default repository branch: `main`
- Commercial status: pre-revenue product asset unless separately verified

## 2. Source-access protocol

The source repository is intentionally private for the acquisition process. Repository access is not provided through the public sales page.

Read-only source access may be granted only after:

1. The prospective buyer is identified.
2. The buyer demonstrates ability to fund the proposed transaction.
3. An appropriate NDA is executed.
4. Access is limited to the agreed diligence scope and duration.

The repository was previously public. This fact is disclosed for diligence. Making the repository private does not erase historical distribution or represent that no third-party copies exist.

## 3. Code and build review

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

## 4. Runtime review

Verify in a buyer-controlled environment:

- Application starts successfully.
- Database connection works.
- Migrations apply successfully.
- `/api/health` reports the expected readiness state.
- Authentication and authorization operate as intended.
- Security-decision API rejects unauthorized requests.
- Kill-switch behavior matches the documented fail-closed model.
- Empty-data state does not fabricate telemetry.

## 5. Security review

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
- Secret-scanning results and any historical secret exposure.

## 6. Commercial review

Revenue, customers, contracts, traffic, retention, valuation, certifications, regulatory status, security attestations, and production performance should be treated as **unverified unless supporting evidence is provided separately**.

## 7. Asset-transfer review

The proposed software/product asset package may include, subject to the definitive transaction agreement:

- ELITZE Agentic Security source code and commit history.
- Application and database migrations.
- SDK and product/security documentation.
- ELITZE brand and visual assets owned by the seller.
- `elitze.info` domain, if transferable under the transaction.
- Deployment configuration and documentation.
- Sales and acquisition materials.
- Transferable cloud, analytics, communications, and social accounts only where legally and contractually transferable.
- No ongoing managed service or SaaS operation is included. Any transition assistance must be optional, limited, and separately agreed in the definitive transaction documents.

The seller's personal GitHub account, personal email and financial accounts, unrelated repositories/projects, non-transferable vendor accounts, and third-party IP not owned by the seller are excluded.

## 8. Evidence rule

A buyer should prefer reproducible evidence over screenshots or verbal claims. Production status should be independently verified before closing.
