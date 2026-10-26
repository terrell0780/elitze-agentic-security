type PlatformOwnerIdentity = { email?: string | null } | null | undefined;

/**
 * Platform ownership is provisioned only by an environment-managed email
 * allowlist. Tenant role "owner" means business/organization owner and never
 * grants access to platform-wide operations or other tenants.
 */
export function isPlatformOwner(user: PlatformOwnerIdentity): boolean {
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email) return false;
  const configured = (process.env.ELITZE_PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email);
}
