# ELITZE Agentic Security — Architecture and Transfer

## Architecture summary

The repository describes ELITZE as a governed security control plane connecting:

**Security graph context → Policy enforcement → Generation/runtime behavior → Continuous validation → Evidence**

The product acceptance loop is:

**Detect → Explain → Authorize → Act → Retest → Evidence**

The documented security boundary is not the model or agent. Internal security-decision and containment APIs are separately authenticated, and containment is designed to fail closed when the infrastructure executor is unavailable.

## Technical foundation visible in the repository

- Next.js application.
- TypeScript configuration and lint/typecheck/build workflows.
- Drizzle database configuration and migrations.
- Environment-driven secret configuration.
- Database-backed security and application APIs.
- Git-based source repository.

## Production setup described by the repository

- Copy `.env.example` into a secret-managed environment.
- Configure `DATABASE_URL`.
- Configure `ELITZE_INTERNAL_API_KEY`.
- Run database migrations.
- Run typecheck, lint, tests, and build.
- Deploy with the matching runtime environment and database.

## Transfer package

A sale should explicitly identify which of the following are included:

### Software/IP

- Source repository.
- Application source code.
- Configuration templates that are safe to transfer.
- Database schema/migrations.
- Documentation.
- Tests and build configuration.
- Product UI and product copy contained in the repository.

### Digital assets — only if expressly included

- `elitze.info` domain.
- Trademarks and brand assets.
- Social accounts.
- Analytics properties.
- Deployment account(s).
- Cloud/database accounts.
- Customer contracts or customer data only if they actually exist, are verified, legally transferable, and expressly included in the definitive agreement.

### Operating-model boundary

The seller is not offering an ongoing SaaS service, managed hosting operation, billing operation, customer-support function, renewal program, or customer-success organization.

### Credentials

Production credentials, API keys, database passwords, signing keys, and personal access tokens must **never** be placed in this package or committed to Git. They should be transferred through a secure credential-transfer process agreed by the parties.

## Buyer handoff

The seller should provide a clean inventory of repositories, domains, infrastructure, dependencies, secrets-management requirements, outstanding blockers, known defects, and third-party obligations before closing.

## Critical transaction distinction

Buying the source code does not automatically transfer a legal entity, contracts, trademarks, domains, customer data, cloud resources, or third-party licenses. The transaction agreement must define those assets separately.
