# ELITZE SOC 2 Scope and Start

## Objective

Start the ELITZE SOC 2 program with a controlled system scope and evidence inventory. This document defines the initial scope only; it is not a SOC 2 report, certification, or attestation.

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

## Scope boundary rule

A component is in scope when failure or misuse of that component could materially affect the confidentiality, integrity, availability, security, or authorized processing of the in-scope ELITZE service.

A component may not be treated as out of scope merely because it is operated by a third party. Third-party dependencies must instead be classified as a subprocessor, infrastructure dependency, or other relevant external service and assessed for evidence and control responsibility.

## Current program state

- SOC 2 examination: **NOT STARTED**
- SOC 2 Type I report: **NOT AVAILABLE**
- SOC 2 Type II report: **NOT AVAILABLE**
- Independent attestation: **NOT AVAILABLE**
- Scope definition: **STARTED**
- Control/evidence mapping: **REQUIRED**
- External CPA engagement: **REQUIRED**

No public or customer-facing material may describe ELITZE as SOC 2 certified, SOC 2 attested, or SOC 2 compliant solely because this document exists.

## Immediate evidence inventory

For every in-scope component, create an evidence record containing:

- system/component name
- environment
- owner
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

Obtain a SOC 2 readiness assessment and CPA-firm engagement scoped to the system described here. Final examination scope must be confirmed with the independent CPA firm before claiming that any SOC 2 criterion has been examined.

## Acceptance rule

The program advances only when the relevant control is implemented, operating in the actual environment, supported by current evidence, and independently assessed where the examination requires it. Missing evidence results in **UNKNOWN/BLOCKED**, not an assumed pass.
