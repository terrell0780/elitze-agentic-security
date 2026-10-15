---
name: elitze-ciso-build-standard
description: Build or review ELITZE Agentic Security using NIST CSF, zero-trust boundaries, explicit acceptance criteria, and truthful implementation status.
---

# ELITZE CISO Build Standard

## Project context
- Product focus: agent identity and MCP runtime security.
- Use the control loop: Discover, Identify, Map Reach, Evaluate Policy, Decide, Authorize Execution, Observe, Retest, Prove.
- Treat identity, tenant boundaries, policy enforcement, separately authorized execution, observation, and evidence integrity as security boundaries.
- Never add mock production records, synthetic telemetry, fabricated customers/results, or placeholder success states.
- Represent insufficient evidence as UNKNOWN, UNMEASURABLE, or INSUFFICIENT_REACH.

## Required workflow
1. Inspect implementation, tests, config contracts, and CI before changing files.
2. Map each acceptance criterion to code, a test, and expected evidence.
3. Make focused changes with regression coverage.
4. Run applicable self-tests, typecheck, lint, build, audit, and DB/auth checks when prerequisites exist.
5. Inspect actual results; adding a test or workflow step does not make it pass.
6. Report paths changed, commit/PR references, actual verification, and externally dependent steps.

## Review points
- Tenant isolation and authorization at every data boundary.
- Default-deny when required identity or policy evidence is missing.
- Least privilege, exact destination allowlists, safe outbound transport and bounded responses.
- Separation of policy decision from execution authorization.
- Durable provenance, freshness, correlation IDs, and tamper-evident evidence.
- Approval and audit boundaries for high-impact actions.
- Server-side secrets only; never commit credentials.

A feature is operational only when code, configuration, and relevant runtime/test evidence support that status. Distinguish CODE PRESENT, TESTED, INTEGRATED, and UNKNOWN.
