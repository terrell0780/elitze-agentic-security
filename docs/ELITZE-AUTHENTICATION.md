# ELITZE Agentic Security — Authentication Contract

## Implemented in `security/identity-session-hardening`

- Email/password registration with 12–256 character password bounds.
- Passwords stored as salted scrypt hashes; plaintext passwords are never persisted.
- Mandatory email verification before an account becomes active.
- Opaque 256-bit session tokens stored only as SHA-256 hashes in PostgreSQL.
- HTTP-only, SameSite=Lax cookies; Secure is enabled in production.
- Persistent login defaults to a renewable 30-day session. It is not an infinite session.
- Session renewal occurs when less than seven days remain and is bounded by the configured session lifetime.
- Logout revokes the current server-side session.
- Password reset tokens are one-time and expire after 30 minutes; successful reset revokes all existing sessions.
- Email verification tokens are one-time and expire after 60 minutes.
- Failed password attempts are tracked and ten consecutive failures trigger a temporary lock.
- Forgot-password responses are intentionally generic to reduce account enumeration.
- Console access requires an authenticated server-side session.
- Tenant identity comes from the authenticated session, not from browser-supplied tenant IDs.

## Required production configuration

- `DATABASE_URL` — real PostgreSQL connection string.
- `RESEND_API_KEY` — real transactional email provider credential.
- `RESEND_FROM` — verified sender address.
- `NEXT_PUBLIC_SITE_URL` — canonical public origin used in verification/reset links.

No development fallback sends fake emails or creates synthetic sessions.

## Remaining enterprise work

Authentication is not equivalent to full enterprise IAM. OIDC/SSO, MFA/passkeys, centralized lifecycle provisioning, device/session administration, distributed rate limiting, and enterprise identity-provider integration remain separate controls and must be proven before an enterprise-readiness claim.
