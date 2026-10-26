# ELITZE organization onboarding and access

## Tenant creator

Every successful sign-up creates a new tenant and assigns the creating user the persisted `owner` role in the same database transaction. The role is not accepted from browser input. An owner is normalized to the authorization module's `OWNER` role and can administer their tenant.

Registration endpoints share the same IP-and-email rate-limit bucket. Account email is serialized during sign-up and invitation acceptance so concurrent requests cannot create duplicate accounts through those flows. Existing email addresses receive a conflict response rather than silently creating another tenant with an ambiguous login identity.

## Organization members

Owners and security admins can use `/console/organization`. The server-side page and `GET/POST/DELETE /api/console/members` enforce the authenticated tenant and role on every request.

- Owners can invite security admins, analysts/members, approvers, and read-only viewers.
- Security admins can invite analysts/members, approvers, and viewers, but cannot grant a peer admin role.
- Invitations are single-use, token-hashed in the database, scoped to the inviting tenant, and expire after seven days.
- The inviter can revoke a pending invitation. Expired, revoked, or accepted invitations cannot be accepted again.
- Accepting an invitation creates an active, email-verified account within the invitation tenant, consumes the invitation in the same transaction, and starts a session.
- Invitations to an email already associated with an ELITZE account are rejected. The present account model gives each user one tenant; cross-tenant membership and tenant switching are not yet implemented.

## Role permissions

The control-plane authorization module normalizes legacy lowercase roles from `auth_users` (`owner`, `admin`, `member`, `approver`, `viewer`) into its canonical role vocabulary. Unknown roles remain denied. Tenant ID equality is checked before permission grants.

The current permission model is:

| Role | Permissions |
|---|---|
| Owner | All tenant permissions and organization membership administration |
| Security admin | Security read/write/respond/approve and integration management; may invite non-admin members |
| Analyst / member | Security read and write |
| Approver | Security read and governed approval |
| Viewer | Security read only |

## Operational prerequisites

- Email delivery must be configured; invitations fail closed and are revoked if sending fails.
- Apply the SQL migrations before using this feature.
- Keep request-body logging disabled for credentials and invitation tokens.
- Admin endpoints derive tenant identity from the authenticated session, never from a caller-supplied tenant ID.
