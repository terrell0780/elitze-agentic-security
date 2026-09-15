# ELITZE SOC 2 Scope and Start

## Objective

Start the ELITZE SOC 2 program with a controlled system scope, selected Trust Services Criteria, and evidence inventory. This document is an internal readiness/control document; it is not a SOC 2 report, certification, or attestation.

## Initial system scope

The initial SOC 2 system scope covers, at minimum:

1. **`elitze.ca`** — public application entry point and customer-facing service surface.
2. **ELITZE application and control plane** — application services, policy decisioning, enforcement paths, APIs, console, and security-control logic.
3. **Production database** — production persistence, schema, access, backups, restoration, encryption, and administrative operations.
4. **Authentication and authorization** — login/session controls, tenant boundaries, RBAC, privileged access, API authentication, and authorization decisions.
5. **Agent/MCP policy enforcement** — agent identity, MCP/tool authorization, policy evaluation, runtime enforcement, approval requirements, and related evidence.
6. **Evidence and audit systems** — security events, decision records, evidence provenance, retention, integrity controls, exports, and verification mechanisms.
7. **Deployment infrastructure** — hosting, deployment configuration, runtime configuration, secrets management, networking, monitoring, and production change paths.
8. **Source-code and CI/CD controls** — source repositories, code review, branch/release controls, build pipelines, security scanning, dependency controls, and release provenance.
9. **Backups and recovery** — backup configuration, access, recovery procedures, restoration tests, disaster-recovery evidence, and recovery objectives.
10. **Personnel and administrative access** — owner/admin access, service identities, privileged workflows, access reviews, onboarding/offboarding, credential rotation, and break-glass procedures.
11. **Relevant subprocessors** — external services that materially process, store, transmit, secure, authenticate, monitor, deploy, or otherwise support in-scope ELITZE data or operations.

## Trust Services Criteria selection

AICPA's SOC 2 Trust Services Criteria cover **Security, Availability, Processing Integrity, Confidentiality, and Privacy**. citeturn344736search0turn344736search2

### Selected for the initial ELITZE program

**1. Security — INCLUDED**

Security is the initial mandatory criterion for ELITZE because the service is a security control plane. The scoped control program must address protection against unauthorized access, use, disclosure, modification, or destruction of systems and information relevant to the service.

**2. Availability — INCLUDED**

Availability is included because ELITZE operates a customer-facing service and its security-control function must have explicit availability, continuity, recovery, and service-level expectations. Availability evidence must be based on actual operational measurements and recovery testing, not stated targets alone.

**3. Confidentiality — INCLUDED**

Confidentiality is included because ELITZE may handle customer security data, credentials or credential references, proprietary code/context, policy configurations, graph relationships, evidence, and other information that customers may designate as confidential. Scope and control design must follow the actual data processed by the service.

**4. Privacy — CONDITIONAL / REQUIRED WHEN APPLICABLE**

Privacy is not automatically claimed. It becomes part of the examination scope when ELITZE's actual processing activities and customer commitments require the Privacy criterion. The decision must be based on actual personal-information processing, jurisdictions, contracts, and the final CPA-firm scope determination.

**5. Processing Integrity — CONDITIONAL / REQUIRED WHEN APPLICABLE**

Processing Integrity becomes part of the examination scope when ELITZE makes material commitments about the completeness, validity, accuracy, timeliness, or authorized execution of processing. The criterion is particularly relevant to policy decisions, enforcement outcomes, evidence generation, and other customer-facing security processing where those characteristics are contractually or operationally promised.

## Selection rule

The initial ELITZE readiness program therefore tracks:

- **Security: REQUIRED NOW**
- **Availability: REQUIRED NOW**
- **Confidentiality: REQUIRED NOW**
- **Privacy: ASSESS AND INCLUDE WHEN REQUIRED BY ACTUAL PROCESSING/COMMITMENTS**
- **Processing Integrity: ASSESS AND INCLUDE WHEN REQUIRED BY ACTUAL PROCESSING/COMMITMENTS**

The final examination scope must be confirmed with the independent CPA firm. A criterion being tracked internally does not mean that ELITZE has been examined against it.

## Scope boundary rule

A component is in scope when failure or misuse of that component could materially affect the confidentiality, integrity, availability, security, or authorized processing of the in-scope ELITZE service.

A component may not be treated as out of scope merely because it is operated by a third party. Third-party dependencies must instead be classified as a subprocessor, infrastructure dependency, or other relevant external service and assessed for evidence and control responsibility.

## Current program state

- SOC 2 examination: **NOT STARTED**
- SOC 2 Type I report: **NOT AVAILABLE**
- SOC 2 Type II report: **NOT AVAILABLE**
- Independent attestation: **NOT AVAILABLE**
- Scope definition: **STARTED**
- Trust Services Criteria selection: **STARTED — SECURITY / AVAILABILITY / CONFIDENTIALITY**
- Privacy criterion: **PENDING APPLICABILITY ASSESSMENT**
- Processing Integrity criterion: **PENDING APPLICABILITY ASSESSMENT**
- Control/evidence mapping: **REQUIRED**
- External CPA engagement: **REQUIRED**

No public or customer-facing material may describe ELITZE as SOC 2 certified, SOC 2 attested, or SOC 2 compliant solely because this document exists.

## Immediate evidence inventory

For every in-scope component and selected criterion, create an evidence record containing:

- system/component name
- environment
- owner
- Trust Services Criterion
- control objective
- control implementation reference
- evidence source
- evidence reference
- observation date/time
- reviewer
- result
- review/expiration date
- remediation reference when applicable

Evidence must distinguish **OBSERVED**, **INFERRED**, **SIMULATED**, **UNKNOWN**, and **UNMEASURABLE**. Simulated or inferred evidence cannot be presented as production operating evidence.

## First external step

Obtain a SOC 2 readiness assessment and CPA-firm engagement scoped to the system and criteria described here. Final examination scope must be confirmed with the independent CPA firm before claiming that any SOC 2 criterion has been examined.

## Acceptance rule

The program advances only when the relevant control is implemented, operating in the actual environment, supported by current evidence, and independently assessed where the examination requires it. Missing evidence results in **UNKNOWN/BLOCKED**, not an assumed pass.
