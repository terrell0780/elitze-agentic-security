# ELITZE Agent Identity and Sara Assistant

## ELITZE product identity

ELITZE Agentic Security is the single product and platform identity. Sara is the ELITZE security assistant.

The product-facing roster contains only:
- **ELITZE** — the security platform and governed control plane.
- **Sara** — the operator-facing security assistant working within ELITZE authorization boundaries.

No other named agent persona is presented as part of the ELITZE product roster.

## Roles and runtime truth

ELITZE and Sara have declared role descriptions and documented capability boundaries. A role description is not proof that a runtime is deployed, a permission is granted, a task is executing, or an outcome has been achieved.

The application preserves these distinctions:
- **OBSERVED** — supported by a connected source and observation record.
- **DECLARED** — stated by the platform or configuration, but not independently verified.
- **INFERRED** — derived from observations through a documented method.
- **UNKNOWN** — evidence is insufficient to determine the fact.
- **UNMEASURABLE** — required measurement could not be completed with current access or telemetry.

User-facing copy may explain an unavailable runtime as “Not verified,” but the underlying state must remain truthful. No sample, simulated, or historical catalog entry is allowed to imply live activity.

## Authorization boundaries

Sara assists with security investigation, source summarization, evidence organization, and policy-aware recommendations. It cannot grant its own permissions, bypass authorization, or perform high-impact actions without the required approval and controlled execution path.

ELITZE controls identity, tenant scope, policy decisions, authorized execution, observation, retesting, and evidence.

## Verification requirements

A runtime is operationally verified only when the implementation is connected to the intended execution path and a real test provides attributable evidence. The record should include the source, identity, timestamp, authorization decision, execution outcome, and evidence reference as applicable.

Repository builds and self-tests validate code contracts; they do not alone prove production integrations or live runtime operation.

## Branding and source provenance

The product UI and supported runtime roster use ELITZE Agentic Security and Sara branding. Remove obsolete third-party product names from active UI and current product documentation. Preserve historical migration records where needed for database integrity; do not present those records as current product branding. External source artifacts require provenance and license review before inclusion.
