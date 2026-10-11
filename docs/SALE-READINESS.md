# ELITZE Agentic Security — Sale Readiness

## Buyer handoff standard

The repository is the canonical ELITZE Agentic Security product source. Acquisition materials must identify the exact commit being transferred and distinguish implemented functionality from dependencies, configuration requirements, planned work, and unmeasurable outcomes.

## Transaction framing

ELITZE is being prepared for an outright B2B asset acquisition, not an ongoing managed SaaS commitment. Buyer and seller should agree the transferred assets, rights, access, handover date, and any post-close assistance in the purchase documents. This repository does not imply that third-party account ownership or vendor contracts automatically transfer with the source code.

The operating footprint identified for handoff is IONOS (domain), Vercel (application hosting/deployment), the ELITZE Runner component/service (hosting and public origin to be confirmed), and Resend (transactional email). Account ownership, transferability, billing responsibility, live credentials, and post-close rotation must be confirmed as transaction items; no account access or secret values are recorded here.

## Current evidence snapshot — 2026-10-10

- The most recent recorded production health observation returned HTTP 200 and reported database connectivity healthy with all 33 expected migrations applied. This verifies that health-check observation only.
- GitHub currently has a repository secret named `ELITZE_RUNNER_HMAC_SECRET`; Vercel has a Production environment-variable entry named `ELITZE_SECURITY_RUNNER_HMAC_SECRET`. Secret contents were not read, so matching values are not verified.
- The actual runner origin is not present as `ELITZE_RUNNER_URL` in GitHub or `ELITZE_SECURITY_RUNNER_URL` in Vercel. The live runner handshake and real scan/callback remain UNVERIFIED. Do not claim live scanning is operational until an existing authorized runner URL is configured and the production handshake plus an authorized end-to-end scan pass.
- Local code/self-tests do not replace external security review, disaster-recovery evidence, or production lifecycle verification.

## Included product assets

- ELITZE Agentic Security application source
- Security control-plane architecture
- Agent, MCP, API, vulnerability, exposure and security operations workflows
- REO verification and evidence architecture
- ROI measurement layer
- governed Security Skill Registry architecture
- database migrations and production setup documentation
- security and audit documentation
- existing acquisition/sales documentation in `sales/` and `docs/`

## Third-party boundary

ELITZE must not claim ownership of third-party community repositories, content, trademarks, code, datasets, or license rights. External skill libraries may inform architecture or be integrated through clearly documented adapters. Third-party material remains subject to its own license and attribution requirements.

## Evidence status

Buyer-facing claims use these status classes:

- **IMPLEMENTED** — present in source and locally verifiable
- **CONFIGURED** — implemented but requires deployment configuration
- **DEPENDENT** — requires a service, credential, executor, or customer-provided input
- **UNMEASURABLE** — insufficient evidence for the claimed outcome
- **PLANNED** — not delivered and not represented as delivered

## Security and transfer boundary

Never commit production credentials, API keys, database URLs, customer data, private deployment values, or generated secret material. Before transfer, run the repository self-tests, typecheck, lint, build, and sale-readiness checks; review history for exposed secrets; review third-party notices; and freeze the exact transfer commit.

## Exclusivity statement

An acquisition can transfer ELITZE-owned source and rights held by the seller. It cannot retroactively make third-party or previously public material exclusive. Prior public distribution must be disclosed where material to the transaction.
