# Enterprise Identity Integration Contract

ELITZE separates authentication from authorization.

Authentication is provided by the deployment's approved identity provider. Once a verified identity is mapped to a tenant principal, ELITZE evaluates tenant scope and permissions using `src/lib/elitze-secure/tenant-security.ts`.

## Required claims

- Stable subject identifier.
- Tenant identifier.
- One or more mapped ELITZE roles.

## Required security behavior

- Reject missing identity.
- Reject missing tenant.
- Reject tenant/resource mismatch.
- Reject unknown roles.
- Reject insufficient permission.
- Do not trust a client-supplied tenant selector as proof of authorization.

Provider adapters should translate verified OIDC/SAML/SCIM identity claims into this contract. Credentials, signing keys, and provider configuration are deployment secrets and must not be stored in source control.
