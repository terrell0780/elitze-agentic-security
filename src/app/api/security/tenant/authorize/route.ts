import { NextRequest } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { authorizeTenantAction, buildPrincipal } from "@/lib/elitze-secure/tenant-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const body = await request.json().catch(() => null) as { tenantId?: unknown; permission?: unknown } | null;
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : "";
  const permission = typeof body?.permission === "string" ? body.permission.trim() : "";
  const principal = buildPrincipal({
    tenantId: request.headers.get("x-elitze-tenant"),
    subjectId: request.headers.get("x-elitze-subject"),
    roles: (request.headers.get("x-elitze-roles") ?? "").split(",").map((role) => role.trim()).filter(Boolean),
  });

  if (!tenantId || !permission) {
    return Response.json({ ok: false, error: "tenantId and permission required" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const result = authorizeTenantAction(principal, { tenantId, permission });
  return Response.json(
    { ok: true, tenantId, permission, subjectId: principal?.subjectId ?? null, allowed: result.allowed, reason: result.reason ?? null },
    { status: result.allowed ? 200 : 403, headers: { "cache-control": "no-store" } },
  );
}
