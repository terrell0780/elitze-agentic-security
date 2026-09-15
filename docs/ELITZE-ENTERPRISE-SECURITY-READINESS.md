# ELITZE Enterprise Security Readiness

## Purpose

This document is the acceptance contract for enterprise deployment of ELITZE Agentic Security. A requirement is not considered complete because it is documented, coded, listed in a registry, or represented in the UI. It becomes claimable only when the required real-world evidence exists and is current.

## Strict status model

Every enterprise control has two independent dimensions: **implementation state** and **claim state**. Implementation never implies assurance.

### Implementation state

- `NOT_STARTED`: no implementation or program evidence exists.
- `PLANNED`: documented target only.
- `IMPLEMENTED`: repository implementation exists and has repeatable verification evidence.
- `CONFIGURED`: implemented and configured for a real tenant/environment with verification evidence.
- `OPERATIONAL`: configured, actively used in the target environment, and supported by current operational evidence.
- `BLOCKED`: prerequisite or dependency is missing and the control cannot be accepted.

### Claim state

- `UNCLAIMABLE`: there is not enough current evidence to make the assertion.
- `EVIDENCE_PENDING`: implementation exists, but required evidence has not been produced or reviewed.
- `VERIFIED`: required evidence exists, is current, is attributable to an identified scope, and has passed review.
- `ACCEPTED_RISK`: the control is not fully verified, but an authorized owner has explicitly accepted the documented residual risk for a defined scope and period.
- `EXPIRED`: previously verified evidence is outside its validity/review period and cannot support a current claim.
- `REJECTED`: evidence failed validation or review.

**Default claim state is `UNCLAIMABLE`.** A documentation page, code path, checklist item, passing unit test, successful build, or UI badge can establish implementation evidence but cannot by itself establish an enterprise assurance claim.

## Prohibited inference rules

ELITZE must not convert any of the following into a positive assurance claim without the required external or operational evidence:

- documentation -> certification
- code implementation -> production readiness
- automated test -> independent penetration test
- security checklist -> SOC 2 or ISO 27001 certification
- privacy policy -> GDPR/PIPEDA compliance determination
- insurance requirement -> active insurance coverage
- planned control -> implemented control
- implemented control -> operational control
- historical test -> current assurance after its validity period
- internal review -> independent assurance
- simulated result -> production observation

No green, compliant, certified, passed, or production-ready state may be rendered unless the underlying claim state is `VERIFIED` or, where explicitly allowed, `ACCEPTED_RISK`.

## Immediate enterprise gate

### Independent security validation

1. Independent penetration test covering web application, APIs, authentication, authorization, tenant isolation, policy enforcement, evidence integrity, deployment surface, and administrative functions.
2. Threat model covering trust boundaries, assets, identities, delegation, MCP/tool execution, credentials, policy decision points, enforcement points, evidence systems, and tenant boundaries.
3. Software bill of materials for every releasable build, with component versions and generation timestamp.
4. SAST, DAST, dependency, license, and secret scanning in CI and release gates.
5. Signed builds and releases with independently verifiable provenance.
6. Vulnerability disclosure program with intake, triage, severity, remediation, communication, and coordinated disclosure procedures.
7. Incident-response plan with named roles, escalation, evidence preservation, customer notification criteria, and recovery procedures.
8. Backup and restore testing with recorded recovery evidence rather than backup existence alone.
9. Tenant-isolation test suite covering authorization, data access, graph paths, evidence, exports, cache boundaries, and background jobs.
10. Privileged-access review covering owner/admin accounts, service identities, break-glass access, credential rotation, and least privilege.
11. Disaster-recovery exercise with measured recovery results and identified gaps.

### Required evidence for each immediate control

Each control must have a machine-readable evidence record containing, at minimum:

- control identifier
- control owner
- implementation reference
- real environment/tenant scope
- test/review procedure
- evidence source and source reference
- observed timestamp
- evidence creation timestamp
- reviewer/approver identity
- result
- evidence integrity/hash reference where applicable
- validity/expiration or next-review date
- remediation reference when failed
- residual-risk acceptance reference when applicable

Absence, staleness, ambiguity, or unverifiable provenance keeps the claim `UNCLAIMABLE` or `EXPIRED`.

## Enterprise assurance program

These are organizational programs and must not be represented as certifications, attestations, or completed assurance activities until the applicable external assessment, examination, certification, contract, or insurance evidence actually exists.

- SOC 2 Type I readiness and examination.
- SOC 2 Type II observation period and examination.
- ISO/IEC 27001 information-security management program and certification process.
- GDPR/PIPEDA privacy and data-governance controls appropriate to actual processing activities and applicable jurisdictions.
- Data-processing agreement and customer contractual privacy terms.
- Subprocessor register with ownership, purpose, data categories, location, and review process.
- Enterprise security questionnaire package with evidence-backed answers.
- Cyber-liability insurance appropriate to the actual operating risk profile.

For SOC 2, ISO 27001, insurance, and other externally validated claims, the required evidence must identify the issuing or assessing organization, covered entity/scope, effective period, and applicable report/certificate/policy reference. A self-authored statement is not sufficient evidence of certification, examination, or coverage.

## Product security requirements

### Identity and authorization

- SSO/SAML for enterprise identity federation.
- SCIM lifecycle management for users and groups.
- RBAC enforced server-side and represented in auditable decisions.
- ABAC capability for tenant, resource, environment, identity, data classification, risk, and contextual authorization where required.
- Privileged-access review and approval workflows.
- Break-glass access with explicit authorization, limited duration, reason, audit evidence, and post-use review.

### Cryptography and data control

- Customer-managed encryption keys where the deployment model supports them.
- Key rotation and revocation procedures.
- Regional data-residency controls tied to actual storage and processing locations.
- Configurable evidence and security-data retention.
- Legal holds that override ordinary deletion schedules only for explicitly scoped records.
- Exportable audit/evidence bundles.

### Availability and operations

- High-availability architecture appropriate to the selected service tier.
- Documented service-level objectives with measured availability and recovery targets.
- Backup, restore, disaster-recovery, and failover testing.
- Administrative approval workflows for sensitive configuration and policy changes.
- Audit export and customer-visible administrative activity records.

## Evidence semantics

For security assertions, distinguish `OBSERVED`, `INFERRED`, `SIMULATED`, `UNKNOWN`, and `UNMEASURABLE`.

- `OBSERVED` requires a real source observation tied to scope and time.
- `INFERRED` may support analysis but cannot be presented as direct observation.
- `SIMULATED` may support design/testing only and can never satisfy a production evidence requirement.
- `UNKNOWN` means the required fact is not established.
- `UNMEASURABLE` means the required measurement cannot currently be produced from available evidence.

## Evidence freshness

Evidence must define an explicit validity or review period appropriate to the control. Expired evidence cannot silently continue to support a current claim. A current claim must reference the latest verified evidence available for the declared scope.

## Release and deployment gate

An enterprise release is not security-ready until every **mandatory** gate has one of these outcomes:

1. `VERIFIED` with current, attributable evidence; or
2. `ACCEPTED_RISK` with an explicit authorized residual-risk decision, defined scope, justification, compensating controls where applicable, owner, and expiration/review date.

Anything else is a deployment block:

- `UNCLAIMABLE`
- `EVIDENCE_PENDING`
- `EXPIRED`
- `REJECTED`
- `BLOCKED`

A residual-risk acceptance does **not** transform the underlying control into `VERIFIED`, `CERTIFIED`, `COMPLIANT`, or `PENETRATION-TESTED`. It only records an authorized decision to proceed despite the documented gap.

## Claim firewall

Public site copy, sales material, console status, acquisition materials, security questionnaires, and API responses must derive assurance language from the claim state and evidence record. The system must not manufacture positive claims from documentation existence.

Examples:

- SOC 2: `UNCLAIMABLE` until applicable examination evidence exists; then `VERIFIED` only for the covered scope and period.
- ISO 27001: `UNCLAIMABLE` until applicable certification evidence exists; then `VERIFIED` only for the covered scope and period.
- Independent penetration test: `UNCLAIMABLE` until a qualifying independent report is recorded and reviewed.
- Cyber insurance: `UNCLAIMABLE` until current policy evidence is recorded for the applicable entity and period.
- Production security readiness: `UNCLAIMABLE` until mandatory operational controls are evidenced in the actual target environment.
- Compliance: never a blanket status; each applicable framework/control scope must be evaluated separately.

The repository must preserve the difference between **implemented**, **operationally verified**, **externally assured**, and **accepted risk**.

## Acceptance principle

**No evidence, no claim. No current evidence, no current claim. No independent evidence, no independent-assurance claim. No verified mandatory controls, no enterprise release.**
