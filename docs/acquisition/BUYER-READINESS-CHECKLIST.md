# ELITZE Agentic Security — Buyer Readiness Checklist

This checklist defines what to assemble for technical due diligence and an asset handoff. It does not represent legal advice, a valuation, or a statement that each item already exists.

## 1. Product positioning

- [ ] One-sentence positioning: ELITZE Agentic Security governs agent identities, MCP servers, tool reachability, sensitive execution policy, and verifiable evidence.
- [ ] Target customer and high-value use cases described without claiming unsupported integrations.
- [ ] Product boundary states what ELITZE does and what remains the responsibility of the customer's IAM, cloud, SIEM, and incident-response systems.
- [ ] Current capabilities, roadmap items, and external dependencies are separated.

**Done when:** A buyer can identify the problem, core control path, target users, and product boundary from one page.

## 2. Demonstration

- [ ] Demo environment and exact source revision recorded.
- [ ] Agent identity and MCP server source are shown.
- [ ] Observed reachability and coverage gaps are shown.
- [ ] A harmless allowed action succeeds through the intended enforcement boundary.
- [ ] A protected denied action is blocked before the protected handler executes.
- [ ] Actual result and evidence records are displayed.
- [ ] A policy change is followed by a retest.
- [ ] Test fixtures, simulated data, and live external evidence are labeled distinctly.

**Done when:** A reviewer can reproduce the allowed and denied scenarios and correlate decisions with execution outcomes.

## 3. Technical proof

- [ ] Architecture and trust-boundary diagrams.
- [ ] Build, typecheck, lint, dependency audit, and security test outputs tied to commit SHA.
- [ ] Authentication, authorization, tenant isolation, and data-retention design.
- [ ] Threat model and security assumptions.
- [ ] Integration register with provider, environment, status, last verification, required permissions, and limitations.
- [ ] Software bill of materials and dependency license report.
- [ ] Backup, restore, deployment, rollback, and incident-response instructions.
- [ ] Known gaps and unverified claims recorded without concealing them.

**Done when:** A technical reviewer can trace each material claim to a reproducible test, source file, configuration, or explicit limitation.

## 4. Ownership and transfer

- [ ] Repository and relevant account ownership identified.
- [ ] Contributor and contractor assignment records reviewed by qualified counsel.
- [ ] Third-party dependency and asset licenses reviewed.
- [ ] Domain, DNS, deployment, database, email, and external-provider transfer requirements listed.
- [ ] Secret values excluded from repository and handoff documents; rotation and transfer procedures documented.
- [ ] Data ownership, privacy obligations, retention, deletion, and any customer data transfer constraints documented.
- [ ] Clean-checkout build and deployment rehearsal completed.
- [ ] Post-transfer access revocation and credential rotation plan prepared.

**Done when:** The buyer can identify the assets and rights included, required consents and dependencies, and a safe transfer sequence. Legal ownership is not assumed merely because code is present in the repository.

## 5. Acquisition proposition

- [ ] Asset scope and exclusions.
- [ ] Product differentiation and supported use cases.
- [ ] Technical maturity evidenced by current results.
- [ ] Integration status and required buyer work.
- [ ] Handoff and transition scope.
- [ ] Any financial, customer, or performance claims supported by records.

**Done when:** Every material statement in the buyer brief has evidence or is explicitly identified as an assumption or future plan.

## Evidence index template

| Claim | Evidence link or artifact | Commit/environment | Verification date | Status | Limitations |
|---|---|---|---|---|---|
| Build succeeds | Add actual workflow run | Commit SHA | Date | Not entered until verified | Exact environment |
| Policy blocks protected action | Add test report and correlated execution evidence | Commit/test environment | Date | Not entered until verified | Tool paths covered |
| External MCP connection works | Add authorized integration test | Integration environment | Date | Not verified until tested | Permissions and server scope |
| Recovery works | Add restore-test report | Isolated environment | Date | Not verified until tested | RPO/RTO measured or unknown |

Never replace missing evidence with a screenshot of a static dashboard or a manually written success label.
