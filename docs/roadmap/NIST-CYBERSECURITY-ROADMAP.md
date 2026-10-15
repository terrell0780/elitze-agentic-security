# ELITZE Agentic Security — NIST Five-Function Roadmap

**Purpose:** Define an evidence-led implementation plan for agent identity and MCP runtime security, using the five NIST Cybersecurity Framework functions. This roadmap is an engineering plan, not a claim of certification or completion.

## Scope and operating rules

ELITZE's initial proof path is: Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove.

- Production records must originate from connected sources or be clearly identified as test fixtures.
- Do not infer that an asset is safe or absent because telemetry is missing.
- Use explicit states such as OBSERVED, DECLARED, INFERRED, UNKNOWN, and UNMEASURABLE internally; present concise wording in the UI without changing the underlying truth.
- Every security claim needs a source, test, record, or documented limitation.
- No production deployment or live external connection is authorized by this document alone.

## Architecture summary

| NIST function | Architecture and tool options | Priority 1 | Priority 2 | Blind spot / failure mode | Acceptance evidence |
|---|---|---|---|---|---|
| Identify | Tenant-scoped agent/MCP inventory; identity and ownership registry; tool catalogue; reachability graph; dependency/SBOM inventory. PostgreSQL/Neon for durable records; OpenTelemetry only where sources are instrumented; SPDX or CycloneDX for SBOM. | Record each known agent, MCP server, tool, owner, environment, identity, source, and last-observed time. | Map observed and inferred reachability and show coverage gaps. | Inventory appears complete while unconnected environments or indirect tool paths remain unseen. | A known test environment is discovered; relationships have provenance; unobserved resources remain unknown. |
| Protect | Authentication and tenant isolation; workload identity; pre-execution policy enforcement; least privilege; secrets management; immutable/append-only evidence where supported. OIDC, MFA/WebAuthn, a cloud secrets manager, and OPA are candidate integrations subject to actual compatibility testing. | Enforce policy at the execution boundary, before sensitive tool calls. | Protect tenant scope, credentials, administrator actions, and policy changes. | Policy is advisory or a tool can be called around the enforcement point. | Allowed and denied tests prove that the denied action never reaches the protected tool; decision and execution evidence correlate. |
| Detect | Source-backed runtime events; event normalization; correlation; telemetry health; evidence timeline; SIEM adapters. OpenTelemetry and customer-selected SIEMs are integration options, not presumed active. | Record real policy decisions, executions, identity changes, errors, and security-relevant events with source and timestamps. | Detect unauthorized actions and explicitly surface missing or delayed telemetry. | Silence is interpreted as safety; duplicates or clock drift corrupt timelines. | A controlled event is traceable from source to persisted evidence; missing telemetry generates a coverage warning. |
| Respond | Incident records; triage and investigation workflow; approval-gated containment; credential revocation; case-management connectors such as TheHive if selected. | Write and rehearse playbooks for compromised agent identity, exposed credentials, unauthorized tool use, and evidence-integrity failure. | Separate detection from high-impact containment; require approval and preserve evidence. | Automated containment interrupts legitimate workloads or destroys evidence. | A controlled incident produces an attributable incident record, authorized response, and post-action evidence. |
| Recover | Database backups; versioned policy/configuration; restore procedures; credential rotation; integrity checks; regression retests. | Prove restoration of required data and configuration in an isolated environment. | Validate tenant boundaries, rotate affected credentials, and rerun security tests before re-enabling execution. | Backups cannot be restored, or recovery reintroduces compromised credentials and unsafe policy. | Restore test passes, integrity and tenant checks pass, and security retests are recorded. |

## Six-week micro-win execution plan

Each micro-win should fit within a focused work session of less than 60 minutes. A micro-win is complete only when its output exists and its acceptance test has a recorded result.

| Week / micro-win | Focused task | Definition of done |
|---|---|---|
| 1A — Inventory contract | Define required agent, MCP server, tool, identity, owner, source, timestamp, tenant, and coverage fields. | Schema and field contract are reviewed and include provenance and unknown-state handling. |
| 1B — Reachability proof | Create a repeatable test fixture representing a known agent-to-tool relationship; keep it clearly labeled as a test fixture. | A test verifies observed versus inferred edges and refuses to call missing edges proof of no access. |
| 2A — Policy boundary | Identify the actual sensitive-tool execution entry point and map where authorization is evaluated. | Source and tests prove policy is evaluated before execution; if no enforceable boundary exists, document that precise gap rather than mark it complete. |
| 2B — Allow/deny test | Add or run paired allowed and denied tests at the real enforcement boundary. | Denied test proves the protected handler was not invoked; allowed test records the result. |
| 3A — Evidence contract | Specify source ID, tenant, event time, ingestion time, identity, decision, outcome, and evidence reference. | Contract and regression test prevent success from being inferred from missing event data. |
| 3B — Telemetry gap test | Test absent source, stale observation, malformed event, and duplicate event handling. | Each condition has a deterministic expected state and test output. |
| 4A — Incident playbooks | Draft playbooks for compromised identity, credential exposure, and unauthorized tool execution. | Each playbook includes trigger, triage, authority, containment, evidence preservation, communication, and closure criteria. |
| 4B — Tabletop exercise | Run a paper/tabletop scenario using the playbook; do not affect production. | Record decisions, elapsed time, missed steps, and follow-up actions. |
| 5A — Recovery runbook | Document backup source, restore steps, required secrets, validation, and rollback. | A reviewer can execute the steps in an isolated environment without exposing secret values in the document. |
| 5B — Restore test | Restore a disposable environment and run integrity, tenant isolation, and authorization tests. | Results are recorded; any failure remains open with an owner rather than being marked complete. |
| 6A — Evidence bundle | Collect current build/test results, architecture, integration register, dependency/license inventory, and deployment instructions. | Every included result points to an actual run, file, or source record. |
| 6B — Buyer handoff rehearsal | Have a reviewer follow the deployment and demo instructions from a clean checkout. | Reviewer records the exact commit, commands, prerequisites, outcome, and unresolved dependencies. |

## Delivery sequence and dependencies

1. Start with inventory and reachability because policy scope depends on knowing which identities and tools exist.
2. Prove the enforcement boundary before building richer analytics; event volume is not useful if sensitive calls can bypass policy.
3. Establish evidence semantics before alerting so unknown and missing telemetry cannot be mislabeled as safe.
4. Rehearse incident response in a test environment before authorizing automated containment.
5. Test restoration before claiming recoverability.
6. Assemble the acquisition package from actual implementation and test artifacts.

## Metrics

Track these only when a reliable denominator and source exist:

- Percentage of discovered agents and MCP servers with a known owner and identity.
- Percentage of observed tool relationships with source provenance and freshness.
- Percentage of sensitive tool execution paths covered by pre-execution policy enforcement.
- Allowed/denied test pass rate and count of enforcement bypasses found.
- Percentage of security events with source, tenant, timestamps, decision, outcome, and evidence reference.
- Mean time to triage in tabletop exercises, with the scenario and timing method recorded.
- Restore-test success rate and time to restore in the test environment.
- Number of unknown/unmeasurable coverage gaps and their assigned owners.

Do not publish a metric if its denominator is unknown or the underlying data is simulated.

## Compliance alignment

Use NIST CSF 2.0 to organize governance and technical outcomes. For a company pursuing SOC 2, map controls and evidence to the applicable Trust Services Criteria and engagement scope with the auditor. For GDPR, include privacy roles, data minimization, access controls, retention, processor/subprocessor obligations, and a breach assessment/notification workflow. A roadmap or tool does not itself establish SOC 2 attestation or GDPR compliance.

## Completion standard

A function is demonstrated only when the acceptance evidence exists and is attributable to the current source revision or test environment. A passing local test does not prove a live third-party integration. External integration status remains not verified until an authorized endpoint, valid credentials, authenticated discovery, a real decision/action, and attributable evidence have been tested.
