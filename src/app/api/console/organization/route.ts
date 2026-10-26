import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPgPool } from "@/db";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { normalizeTenantRole } from "@/lib/elitze-secure/tenant-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const organizationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(120),
}).strict();

function canRead(role: string) {
  const normalized = normalizeTenantRole(role);
  return normalized === "OWNER" || normalized === "SECURITY_ADMIN";
}
function isOwner(role: string) {
  return normalizeTenantRole(role) === "OWNER";
}
function respondUnauthenticated() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
}

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return respondUnauthenticated();
  if (!canRead(user.role)) return NextResponse.json({ ok: false, error: "organization_profile_forbidden" }, { status: 403, headers: privateHeaders });
  try {
    const result = await getPgPool().query(
      `SELECT id,name,slug,created_at AS "createdAt"
       FROM auth_tenants WHERE id=$1 LIMIT 1`,
      [user.tenantId],
    );
    if (!result.rows[0]) return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404, headers: privateHeaders });
    return NextResponse.json({ ok: true, organization: result.rows[0], canEdit: isOwner(user.role) }, { headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE organization profile load failed", error);
    return NextResponse.json({ ok: false, error: "organization_profile_unavailable" }, { status: 503, headers: privateHeaders });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return respondUnauthenticated();
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403, headers: privateHeaders });
  if (!isOwner(user.role)) return NextResponse.json({ ok: false, error: "organization_owner_required" }, { status: 403, headers: privateHeaders });

  const parsed = organizationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_organization_profile" }, { status: 400, headers: privateHeaders });
  try {
    const result = await getPgPool().query(
      `UPDATE auth_tenants SET name=$1,slug=$2 WHERE id=$3
       RETURNING id,name,slug,created_at AS "createdAt"`,
      [parsed.data.name, parsed.data.slug, user.tenantId],
    );
    if (!result.rows[0]) return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404, headers: privateHeaders });
    return NextResponse.json({ ok: true, organization: result.rows[0] }, { headers: privateHeaders });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ ok: false, error: "organization_slug_already_in_use" }, { status: 409, headers: privateHeaders });
    }
    console.error("ELITZE organization profile update failed", error);
    return NextResponse.json({ ok: false, error: "organization_profile_update_unavailable" }, { status: 503, headers: privateHeaders });
  }
}
