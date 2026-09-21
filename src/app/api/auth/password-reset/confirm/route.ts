import { NextRequest } from "next/server";
import { assertSameOrigin, consumeRateLimit, getRateLimitKey, consumeToken, hashPassword } from "@/lib/auth";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const body = await request.json() as { token?: unknown; password?: unknown };
    if (typeof body.token !== "string" || typeof body.password !== "string" || body.token.length > 200) {
      return Response.json({ error: "invalid_or_expired_token" }, { status: 400 });
    }
    if (!(await consumeRateLimit(await getRateLimitKey("password-reset-confirm"), 10))) {
      return Response.json({ error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "900" } });
    }

    const record = await consumeToken(body.token, "password_reset");
    if (!record) return Response.json({ error: "invalid_or_expired_token" }, { status: 400 });

    const passwordHash = await hashPassword(body.password);
    const db = getPgPool();
    await db.query("BEGIN");
    try {
      await db.query(
        `UPDATE auth_users SET password_hash=$1, failed_login_count=0, locked_until=NULL, updated_at=now()
         WHERE id=$2 AND tenant_id=$3`,
        [passwordHash, record.userId, record.tenantId],
      );
      await db.query(
        `UPDATE auth_sessions SET revoked_at=now()
         WHERE user_id=$1 AND tenant_id=$2 AND revoked_at IS NULL`,
        [record.userId, record.tenantId],
      );
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "password_policy") {
      return Response.json({ error: "password_policy" }, { status: 400 });
    }
    console.error("ELITZE password reset confirmation failed", error);
    return Response.json({ error: "password_reset_unavailable" }, { status: 503 });
  }
}
