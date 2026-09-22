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
- Multi-stage Docker runtime image definition.
- Portable Compose deployment with bundled PostgreSQL for isolated evaluation.
- Hardened enterprise Compose deployment for customer-managed PostgreSQL.
- Container security self-test and blocking CI image scan.

## Deployment layers described by the repository

### Portable evaluation

`compose.yaml` runs ELITZE with PostgreSQL 18.6 on a private backend network. The migration service must complete before the application starts. The application has a read-only root filesystem, dropped capabilities, no-new-privileges, bounded resources and a container health check.

### Enterprise

`docker-compose.enterprise.yml` runs the same runtime image against customer-managed PostgreSQL. The database URL is provided as a Docker secret and the application is bound to a configurable local interface so a customer ingress, WAF or load balancer can sit in front of ELITZE.

### Build and supply-chain controls

The Dockerfile is multi-stage and runs the final image as the unprivileged `nextjs` user. Compose enables SBOM and provenance attestations. The production gates validate Compose configuration, build the image, verify the runtime user and run a blocking CRITICAL/HIGH Trivy image scan.

The deployment documentation covers hosted SaaS, customer-managed cloud, private cloud/on-premises and controlled/isolated patterns. Customer network policy remains responsible for outbound database, model and security-integration access.

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
- Third-party subscriptions.
- Customer contracts and data.

### Credentials

Production credentials, API keys, database passwords, signing keys, and personal access tokens must **never** be placed in this package or committed to Git. They should be transferred through a secure credential-transfer process agreed by the parties.

## Buyer handoff

The seller should provide a clean inventory of repositories, domains, infrastructure, dependencies, secrets-management requirements, outstanding blockers, known defects, and third-party obligations before closing.

## Critical transaction distinction

Buying the source code does not automatically transfer a legal entity, contracts, trademarks, domains, customer data, cloud resources, or third-party licenses. The transaction agreement must define those assets separately.
