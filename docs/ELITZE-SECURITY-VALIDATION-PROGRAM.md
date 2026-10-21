# ELITZE Security Validation Program

## Purpose

This program defines a controlled method to verify security behavior in an explicitly authorized ELITZE Agentic Security test environment. It is not evidence that a test, integration, or outcome has already occurred.

## Scope and authorization

Every validation run must establish:

- written authorization and Rules of Engagement;
- tenant and environment boundaries;
- named operator and workload identity;
- in-scope targets, protocols, accounts, and permitted actions;
- exclusions, request limits, timeouts, stop conditions, and escalation path;
- evidence collection, retention, and deletion requirements;
- success criteria agreed before testing.

Execution remains disabled unless the request is authorized, scoped, policy-approved, and permitted by the selected test profile. No model-generated instruction can expand approved scope.

## Security validation sequence

1. **Discover** authorized assets and connected sources.
2. **Identify** the human actor, tenant, workload identity, and relevant privileges.
3. **Map reach** using observed relationships and explicit evidence state.
4. **Evaluate policy** before any sensitive action.
5. **Decide and authorize** with an attributable decision and applicable approval.
6. **Execute safely** within the approved target list, timeouts, and limits.
7. **Observe** real provider or runtime results.
8. **Retest** the original condition after remediation.
9. **Prove** the outcome with verifiable source-attributed evidence.

Use harmless fixtures and non-sensitive data where possible. Destructive actions require separate explicit authorization and a rollback plan.

## Evidence requirements

For each run, record the exact source commit, product version, environment, tenant-scoped identity, authorization reference, test profile, time window, source references, actual result, evidence integrity metadata, limitations, and reviewer. Distinguish observed facts from inferences and operator-supplied assumptions.

Metrics are reportable only when the source data, scope, collection method, observation window, and calculation are available. If evidence is missing, record `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH`.

## Failure and completion rules

A run must fail closed if identity, authorization, scope, required policy, or a security-critical dependency is unavailable. A plan is not proof of execution; a requested containment action is not proof that the underlying system changed; and a remediation status is not proof that the original path is no longer reachable.

A validation is complete only when its results are attributable, integrity-checked where supported, reviewed, and connected to a retest of the original condition. Documentation, source-code presence, and a scheduled job are not evidence that a live test ran.
