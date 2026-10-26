export type TenantRole = "OWNER" | "SECURITY_ADMIN" | "ANALYST" | "APPROVER" | "VIEWER";

const ROLE_PERMISSIONS: Record<TenantRole, readonly string[]> = {
  OWNER: ["*"],
  SECURITY_ADMIN: ["security:read", "security:write", "security:respond", "security:approve", "integrations:manage"],
  ANALYST: ["security:read", "security:write"],
  APPROVER: ["security:read", "security:approve"],
  VIEWER: ["security:read"],
};

export type TenantPrincipal = {
  tenantId: string;
  subjectId: string;
  roles: TenantRole[];
};

/**
 * Normalize the persisted auth_users role vocabulary into the authorization
 * vocabulary. Existing accounts can contain legacy lowercase role names;
 * without this mapping the principal was discarded and control-plane calls
 * incorrectly returned 403 for every normal signup account.
 */
export function normalizeTenantRole(value: unknown): TenantRole | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toUpperCase().replace(/[ -]+/g, "_")) {
    case "OWNER":
    case "TENANT_OWNER":
      return "OWNER";
    case "ADMIN":
    case "SECURITY_ADMIN":
    case "TENANT_ADMIN":
      return "SECURITY_ADMIN";
    case "ANALYST":
    case "MEMBER":
    case "USER":
      return "ANALYST";
    case "APPROVER":
      return "APPROVER";
    case "VIEWER":
    case "READ_ONLY":
    case "READONLY":
      return "VIEWER";
    default:
      return null;
  }
}

export function isTenantRole(value: unknown): value is TenantRole {
  return typeof value === "string" && ["OWNER", "SECURITY_ADMIN", "ANALYST", "APPROVER", "VIEWER"].includes(value);
}

export function hasTenantPermission(principal: TenantPrincipal, permission: string): boolean {
  return principal.roles.some((role) => ROLE_PERMISSIONS[role].includes("*") || ROLE_PERMISSIONS[role].includes(permission));
}

export function assertTenantScope(principal: TenantPrincipal, tenantId: string): boolean {
  return Boolean(principal.tenantId && tenantId && principal.tenantId === tenantId);
}

export function buildPrincipal(args: { tenantId?: string | null; subjectId?: string | null; roles?: unknown[] }): TenantPrincipal | null {
  const tenantId = args.tenantId?.trim();
  const subjectId = args.subjectId?.trim();
  const roles = [...new Set((args.roles ?? []).map(normalizeTenantRole).filter((role): role is TenantRole => role !== null))];
  if (!tenantId || !subjectId || roles.length === 0) return null;
  return { tenantId, subjectId, roles };
}

export function authorizeTenantAction(principal: TenantPrincipal | null, args: { tenantId: string; permission: string }): { allowed: boolean; reason?: string } {
  if (!principal) return { allowed: false, reason: "tenant_principal_required" };
  if (!assertTenantScope(principal, args.tenantId)) return { allowed: false, reason: "tenant_scope_mismatch" };
  if (!hasTenantPermission(principal, args.permission)) return { allowed: false, reason: "permission_denied" };
  return { allowed: true };
}
