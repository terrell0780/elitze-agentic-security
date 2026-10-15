---
name: elitze-security-review
description: Review ELITZE application and infrastructure changes for authentication, tenant isolation, secure defaults, API exposure, secret handling, and defensible security evidence.
---

# ELITZE Security Review

Use this skill before merging code that touches authentication, APIs, integrations, data handling, authorization, CI/CD, or security controls.

## Review procedure

1. Identify the changed trust boundaries, entry points, data stores, external providers, and privileged actions.
2. Verify authentication and authorization on the server. A hidden UI control is not an authorization boundary.
3. Trace tenant identity from the authenticated session through every read, write, query, audit record, and asynchronous action. Require tenant scoping at the data boundary.
4. Check input validation, request sizes, origin/CSRF controls, URL parsing, redirect handling, DNS/IP restrictions, timeouts, response-size limits, and error handling where relevant.
5. Verify least privilege for credentials and integrations. Never expose tokens, database URLs, cookies, private keys, or sensitive provider responses in client output or logs.
6. Treat model output and retrieved content as untrusted input. Model decisions must not replace deterministic authorization, policy enforcement, approval, or network controls.
7. Confirm sensitive actions require the correct policy decision and, where applicable, explicit, attributable, tenant-scoped, expiring approval.
8. Check that audit evidence has source provenance and cannot be misrepresented as independent verification. Execution alone does not prove successful remediation.
9. Add or update regression tests for the actual failure mode. Tests must use isolated disposable data and must never seed fixtures into production.
10. Report findings with severity, affected file/route, concrete impact, and a focused remediation.

## ELITZE evidence rules

- Real connected evidence only; never invent telemetry, users, incidents, connector health, scan results, or success states.
- Keep missing evidence explicit as UNKNOWN, UNMEASURABLE, NOT_CONFIGURED, or INSUFFICIENT_REACH as appropriate.
- Distinguish code presence and unit tests from a verified live provider connection.
- Use only explicitly authorized targets. Do not run a live scan or destructive action without a documented scope and valid approval.
- Do not deploy to production unless the user explicitly authorizes the deployment.

## Completion criteria

A review is complete only when the relevant tests have actually run or their execution limitation is stated, all critical findings are addressed or listed, and the result is tied to the exact commit under review.
