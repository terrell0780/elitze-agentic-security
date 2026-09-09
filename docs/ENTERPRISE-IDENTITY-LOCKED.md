# Enterprise identity locked

ELITZE authorization is tenant-scoped and role-based. Authentication must come from a verified deployment identity provider. Missing identity, tenant mismatch, unknown role, or insufficient permission is denied.

This boundary is designed to receive verified OIDC/SAML/SCIM claims without embedding provider credentials in application source.
