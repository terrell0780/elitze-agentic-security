# ELITZE Security Addendum — Draft Schedule

Counsel/security-review draft. Control descriptions must match the deployed service tier and actual infrastructure.

## Identity
ELITZE supports enterprise identity controls including SSO, MFA, passkeys/WebAuthn, session rotation, session expiration, authorization and privileged reauthentication where configured.

## Tenant isolation
Tenant-scoped authorization is required for customer security data, graph records, evidence, integrations, administrative activity and exports.

## Policy enforcement
Security-sensitive agent, MCP, A2A, API and integration actions are evaluated at the enforcement boundary before execution where the relevant control is implemented and configured.

## Credential boundary
Provider credentials and security control secrets remain in server-side secret management and are not exposed to browser clients or agent prompts.

## Logging and evidence
Security decisions, material actions, evidence records, administrative events and selected integration observations retain actor, tenant, time, source and correlation/evidence identifiers as applicable.

## Vulnerability management
Releases should use dependency review, security self-tests, type checking, linting, build verification, SBOM generation and additional security testing appropriate to the release.

## Adversarial validation
Independent penetration testing and active adversarial validation are separate evidence classes. Passing ELITZE self-tests does not replace an independent test.

## Availability and recovery
The deployed service tier determines availability architecture, backup, restoration, recovery and continuity controls. Operational claims require measured evidence.

## Data residency
Where supported by the deployment model, the Customer may specify approved storage and processing regions. A configuration setting is not itself proof of residency.

## Evidence states
ELITZE distinguishes OBSERVED, INFERRED, SIMULATED, UNKNOWN and UNMEASURABLE. Only appropriate evidence can satisfy a control claim.

## Review cadence
The enterprise security schedule identifies latest review date, owner, evidence period and next-review date for material controls.
