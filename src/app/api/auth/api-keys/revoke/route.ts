import { assertSameOrigin, consumePrivilegedReauth, getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    if (!(await consumePrivilegedReauth(user))) return Response.json({ error: "recent_reauthentication_required" }, { status: 401 });
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== "string") return Response.json({ error: "invalid_api_key" }, { status: 400 });
    const result = await getPgPool().query(
      `UPDATE auth_api_keys SET revoked_at=now()
       WHERE id=$1 AND tenant_id=$2 AND user_id=$3 AND revoked_at IS NULL RETURNING id`,
      [body.id, user.tenantId, user.id],
    );
    if (!result.rowCount) return Response.json({ error: "api_key_not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("ELITZE API key revoke failed", error);
    return Response.json({ error: "api_key_unavailable" }, { status: 503 });
  }
}
