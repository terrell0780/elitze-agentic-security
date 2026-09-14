# ELITZE Locked Production State

This document is the implementation boundary for the current production track.

## Locked principles

- No synthetic alerts, assets, telemetry, connector health, execution results, or customer data.
- Unknown conditions remain `UNKNOWN` or `UNMEASURABLE`.
- Unconfigured integrations remain `NOT_CONFIGURED`.
- Tenant scope is mandatory for enterprise security data and actions.
- High-impact security actions require explicit approval.
- An approval is durable, expiring, tenant-scoped, and attributable to a decision maker.
- Execution is not proof of remediation; the result must be independently verifiable before a control is considered closed.
- External credentials belong in the deployment secret manager and are never committed to the repository.

## Current control-plane chain

`Identity → Tenant Scope → Policy → Approval → Adapter → Execution → Verification → Evidence → Audit`

## What is implemented in the repository

- Mythos orchestration and Defense Fabric.
- Tenant-scoped authorization primitives.
- Durable approval workflow.
- Persisted integration-event state for idempotency.
- Migration locking and schema verification.
- Explicit connector health/truth states.
- Internal tenant authorization decision endpoint.

## What remains an external deployment integration

Customer identity-provider verification, production SSO/SCIM provisioning, customer-managed keys, real connector credentials, provider-specific scopes, backup/restore infrastructure, and operational RPO/RTO commitments cannot be manufactured by source code. They must be configured and tested against the customer's environment.

## Release gate

A release is not considered enterprise-complete merely because the application builds. It must also pass authorization tests, tenant-isolation tests, migration verification, connector-failure behavior, approval gating, and production observability checks.
