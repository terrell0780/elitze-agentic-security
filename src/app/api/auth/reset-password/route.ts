import { NextRequest } from "next/server";
import { consumeToken, hashPassword } from "@/lib/auth";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { token?: unknown; password?: unknown };
    if (typeof body.token !== "string" || typeof body.password !== "string" || body.token.length > 200) return Response.json({ error: "invalid_or_expired_token" }, { status: 400 });
    if (body.password.length < 12 || body.password.length > 256) return Response.json({ error: "password_minimum_12_characters" }, { status: 400 });
    const record = await consumeToken(body.token, "password_reset");
    if (!record) return Response.json({ error: "invalid_or_expired_token" }, { status: 400 });
    const passwordHash = await hashPassword(body.password);
    const db = getDb();
    await db.query(`UPDATE auth_users SET password_hash=$1, failed_login_count=0, locked_until=NULL, updated_at=now() WHERE id=$2 AND tenant_id=$3`, [passwordHash, record.userId, record.tenantId]);
    await db.query(`UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, [record.userId]);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "password_policy") return Response.json({ error: "password_minimum_12_characters" }, { status: 400 });
    return Response.json({ error: "password_reset_unavailable" }, { status: 503 });
  }
}
