# ELITZE Enterprise Authorization Boundary

ELITZE now has an explicit tenant authorization contract that can sit beneath any customer identity provider.

## Principal

A request is represented by:

- tenant ID
- subject ID
- one or more tenant roles

Supported roles:

- `OWNER`
- `SECURITY_ADMIN`
- `ANALYST`
- `APPROVER`
- `VIEWER`

## Enforcement

Authorization requires all three conditions:

1. A valid tenant principal exists.
2. The principal tenant exactly matches the resource tenant.
3. The principal has the required permission.

A tenant mismatch is a deny condition. It is never treated as a cross-tenant lookup fallback.

## Permission model

`OWNER` has full permission. `SECURITY_ADMIN` can manage security and integrations and approve responses. `ANALYST` can work with security data. `APPROVER` can approve governed actions. `VIEWER` is read-only.

## Identity-provider boundary

This module intentionally does not invent an authentication provider or credentials. A production deployment may map OIDC/SAML/SCIM identities into this principal contract, after which ELITZE applies the same tenant and permission checks.

## Current truth state

The authorization contract is implemented in `src/lib/elitze-secure/tenant-security.ts`. Customer SSO provisioning and provider-specific identity verification remain deployment integrations rather than simulated application behavior.
