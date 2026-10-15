# ELITZE NIST Security Roadmap and Acquisition Walkthrough

## Purpose

This plan connects ELITZE Agentic Security's initial product scope—agent identity, MCP servers and tools, reachability, policy enforcement, authorized execution, observation, retesting, and evidence—to the five NIST Cybersecurity Framework 2.0 functions.

This is an implementation and due-diligence plan, not a claim of NIST certification or proof that every listed control is currently operational. Record only evidence obtained from the repository, a real connected provider, or an explicitly labeled test environment.

## Product positioning

ELITZE Agentic Security helps organizations discover AI-agent and MCP exposure, understand what each identity can reach, evaluate policy before sensitive tool execution, and preserve evidence of decisions and observed outcomes.

Initial buyer value:
- Inventory agents, MCP servers, tools, identities, and known relationships.
- Map observed reachability and identify coverage gaps.
- Enforce authorization at the sensitive execution boundary.
- Preserve attributable decision and execution evidence.
- Retest policy and control changes against a known test environment.

Do not position ELITZE as a complete SIEM, incident-response suite, or compliance certification product unless those specific capabilities have been implemented and independently evidenced.

## NIST CSF 2.0 implementation matrix

| Function | Architecture and candidate tools | Two implementation priorities | Failure mode to guard against | Acceptance evidence |
|---|---|---|---|---|
| Identify | Tenant-scoped agent/MCP/tool inventory; ownership and identity records; reachability graph; dependency inventory. PostgreSQL/Neon for persistent records; OpenTelemetry for instrumented signals; CycloneDX or SPDX for SBOM. | 1. Record identity, owner, source, environment, and observed time for each known asset. 2. Map observed relationships and report discovery coverage and gaps. | An unobserved or indirect asset is silently treated as absent. | Inventory a known test environment and compare observed assets/relationships with a defined expected set; unknown coverage stays explicit. |
| Protect | Workload identity; OIDC and MFA for human operators; least privilege; tenant isolation; secrets manager; policy-as-code such as OPA where suitable; policy enforcement at the tool gateway. | 1. Evaluate and enforce policy before sensitive execution. 2. Prevent tenant-crossing access and keep secrets outside source control. | Policy is only advisory or an alternate path bypasses the enforcement point. | Allowed and denied test actions; proof the denied action did not execute; tenant-isolation tests and attributable decision records. |
| Detect | Authenticated event ingestion; normalized security signals; correlation and alerting; telemetry health; SIEM export only where connected. OpenTelemetry and a buyer-selected SIEM such as Wazuh are candidate integrations. | 1. Record real decisions, execution outcomes, identity changes, and failures with source provenance. 2. Detect missing or delayed telemetry and avoid duplicate-event inflation. | No event is interpreted as no threat, or test events are presented as live customer telemetry. | Trace a controlled event from its source to the stored result; verify deduplication and a visible telemetry-gap state. |
| Respond | Incident record; investigation timeline; approval gate; policy disablement; credential revocation; evidence preservation. TheHive may be used if a reviewed integration is needed. | 1. Document response steps for compromised agent identities, exposed credentials, and unauthorized tool use. 2. Require authorization for high-impact containment. | Automated response interrupts legitimate workloads or destroys evidence. | Controlled incident walkthrough with decision, approval, action, result, and preserved evidence. |
| Recover | Versioned policy/configuration; database backup and restore; credential rotation; integrity validation; post-incident retest. Use database-native backup features and version control where appropriate. | 1. Prove recovery of required records and configuration. 2. Rotate affected credentials and rerun security tests before restoring sensitive execution. | Backup cannot be restored or restores compromised access. | Restore a disposable environment, verify record and tenant boundaries, rotate test credentials, and pass the regression suite. |

## Six-week implementation timeline

Each micro-win should be time-boxed to less than 60 minutes for its first independently reviewable output. The time-box applies to producing and validating the output—not to pretending a complex integration is fully implemented in an hour. Follow-up implementation is split into further micro-wins if required.

### Micro-win 1 — Product claim and scope baseline

**Output:** This document's positioning and acceptance criteria, linked to the existing product README and release record.

**Done means:** A reviewer can distinguish ELITZE's initial product scope from broader future security domains and knows what evidence is required for each NIST function.

### Micro-win 2 — Identify evidence contract

**Output:** A field-level inventory and reachability contract covering tenant, asset/agent identity, MCP server, tool, source, observed timestamp, provenance, confidence/status, and coverage gaps.

**Done means:** The contract specifies required fields, uniqueness/scope rules, and explicit behavior when a source or relationship is unknown; it does not invent observed assets.

### Micro-win 3 — Protect policy-gate proof

**Output:** A reproducible test procedure for one allowed action and one denied sensitive action at the real execution boundary.

**Done means:** The procedure captures the policy decision and proves the denied action did not execute. If the real execution boundary is not available in the test environment, the result is recorded as not verified.

### Micro-win 4 — Detect event-to-evidence trace

**Output:** A controlled event test plan covering source, authentication, tenant binding, validation, persistence, deduplication, and resulting evidence.

**Done means:** One attributable event can be traced end-to-end and a missing-source case is reported as a coverage gap, not as a clean security result.

### Micro-win 5 — Respond playbook

**Output:** Three short incident playbooks: compromised agent identity, exposed tool credential, and unauthorized sensitive tool execution.

**Done means:** Each playbook identifies trigger, triage, authorization, containment, evidence preservation, communication owner, recovery handoff, and closure test.

### Micro-win 6 — Recover proof

**Output:** A disposable-environment backup/restore and retest procedure.

**Done means:** A reviewer can restore the test data and configuration, validate integrity and tenant boundaries, and rerun the security regression checks.

### Micro-win 7 — Demo walkthrough

**Output:** A repeatable script and evidence checklist for a known test agent/MCP server.

**Done means:** The walkthrough shows discovery, identity, reachability, allowed action, denied action, recorded outcome, and retest; every test fixture is labeled and no synthetic result is represented as live customer evidence.

### Micro-win 8 — Technical due-diligence index

**Output:** A linked index to architecture, build/test output, SBOM, dependency/license report, integration register, security controls, and deployment/recovery instructions.

**Done means:** A technical reviewer can locate the supporting evidence for every material product claim without searching the repository manually.

### Micro-win 9 — Ownership and transfer inventory

**Output:** A transfer checklist for repository ownership, intellectual-property assignment records, third-party licenses, domains, infrastructure, secrets handoff, provider accounts, and data-retention obligations.

**Done means:** Every transfer item has an owner and a documented verification method; legal ownership is not asserted merely because source code is present in the repository.

### Micro-win 10 — Acquisition proposition

**Output:** A concise buyer brief describing the acquired assets, target use cases, differentiation, demonstrated workflows, deployment model, dependencies, and integration status.

**Done means:** Each claim links to proof or is explicitly labeled as planned, unverified, or dependent on buyer infrastructure.

## Six-week rollout

| Week | Focus | Planned outcomes |
|---|---|---|
| 1 | Identify | Inventory schema, source provenance, reachability, and coverage reporting. |
| 2 | Protect | Policy enforcement at the sensitive execution boundary, tenant isolation, and allowed/denied tests. |
| 3 | Detect | Attributable events, normalized evidence, duplicate handling, and telemetry-health reporting. |
| 4 | Respond | Incident records, three playbooks, approval gates, containment tests, and evidence preservation. |
| 5 | Recover | Backup/restore, credential rotation, integrity checks, and post-recovery security retests. |
| 6 | Acquisition readiness | Repeatable demonstration, technical due-diligence index, ownership/transfer inventory, and buyer brief. |

## Buyer demonstration walkthrough

Use an authorized disposable test environment with a known agent and MCP server. Do not use a customer's production environment without explicit approval.

1. Open the console and identify the tenant and actual connected sources.
2. Discover the known test agent and show source, identity, owner if known, and last observed time.
3. Inspect the MCP server and its tools; distinguish observed relationships from inferred ones.
4. Show reachability and any coverage gaps.
5. Submit a harmless action that policy permits; show the pre-execution decision and actual result.
6. Submit a protected test action; show the denial and prove the protected tool was not called.
7. Inspect the evidence record: source, timestamp, identity, policy decision, execution outcome, and integrity metadata where implemented.
8. Change a test policy and retest to show the decision changes as expected.
9. Export the test report and label the environment, test fixtures, and any unavailable integration.

**Demo completion criterion:** the reviewer can trace both the allowed and denied paths from request to decision to observed outcome. A dashboard label by itself is not proof.

## Technical proof and handoff checklist

- [ ] Source repository and exact release commit.
- [ ] Reproducible build, typecheck, lint, security-test, and database-backed test results.
- [ ] System architecture, trust boundaries, data flows, and threat model.
- [ ] SBOM plus third-party license review.
- [ ] Security-control matrix with implementation and evidence links.
- [ ] Integration register showing connected, tested, blocked, and unverified states.
- [ ] Deployment, migration, rollback, backup, and restore instructions.
- [ ] Configuration templates without secret values.
- [ ] Ownership and IP assignment records reviewed by appropriate counsel.
- [ ] Domain, cloud, database, CI/CD, and provider-account transfer plan.
- [ ] Secret rotation and account recovery procedure.
- [ ] Data retention, deletion, and privacy obligations.
- [ ] Buyer demonstration script and evidence export.
- [ ] Acquisition brief that separates demonstrated features from future scope.

## Claim and evidence rules

- **Verified:** Supported by a real connected source or a reproducible test with retained results.
- **Declared:** Stated in configuration or documentation but not independently observed.
- **Inferred:** Derived from evidence using a documented method.
- **Unknown / not verified:** Evidence is insufficient to determine the state.
- **Unmeasurable:** Required measurement could not be performed with current access or telemetry.

A successful unit test or adapter self-test proves the tested code contract; it does not, by itself, prove a live external provider connection or customer deployment. Do not publish compliance certification, customer outcomes, coverage percentages, or acquisition value without supporting evidence.

## Reference frameworks

- NIST Cybersecurity Framework 2.0: https://www.nist.gov/cyberframework
- NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: https://csrc.nist.gov/pubs/sp/800/61/r3/final
- AWS Security Best Practices: https://docs.aws.amazon.com/security/
- GDPR, Regulation (EU) 2016/679: https://eur-lex.europa.eu/eli/reg/2016/679/oj

Frameworks guide the work; their mention is not a certification or a claim of compliance.
