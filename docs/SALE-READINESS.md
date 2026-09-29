# ELITZE Agentic Security — Sale Readiness

## Buyer handoff standard

The repository is the canonical ELITZE Agentic Security product source. Acquisition materials must identify the exact commit being transferred and distinguish implemented functionality from dependencies, configuration requirements, planned work, and unmeasurable outcomes.

## Included product assets

- ELITZE Agentic Security application source
- Security control-plane architecture
- Agent, MCP, API, vulnerability, exposure and security operations workflows
- Evidence governance, provenance and verified reachability
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
