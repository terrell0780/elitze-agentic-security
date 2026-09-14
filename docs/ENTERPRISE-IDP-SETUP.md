# Enterprise IdP setup boundary

ELITZE accepts a verified tenant principal from the deployment authentication layer.

Required values at the identity boundary:

- `subjectId`: stable authenticated subject.
- `tenantId`: authoritative customer tenant identifier.
- `roles`: mapped ELITZE roles.

Supported application roles are `OWNER`, `SECURITY_ADMIN`, `ANALYST`, `APPROVER`, and `VIEWER`.

The application authorization layer enforces tenant equality and permission checks after identity verification. The application must not accept an arbitrary browser header as proof of identity in a public deployment; production adapters must derive the principal from a trusted authentication/session layer.

No provider credentials or signing secrets belong in the repository.
