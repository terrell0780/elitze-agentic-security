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
  const roles = (args.roles ?? []).filter(isTenantRole);
  if (!tenantId || !subjectId || roles.length === 0) return null;
  return { tenantId, subjectId, roles };
}

export function authorizeTenantAction(principal: TenantPrincipal | null, args: { tenantId: string; permission: string }): { allowed: boolean; reason?: string } {
  if (!principal) return { allowed: false, reason: "tenant_principal_required" };
  if (!assertTenantScope(principal, args.tenantId)) return { allowed: false, reason: "tenant_scope_mismatch" };
  if (!hasTenantPermission(principal, args.permission)) return { allowed: false, reason: "permission_denied" };
  return { allowed: true };
}
