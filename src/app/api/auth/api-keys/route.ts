import { assertSameOrigin, consumePrivilegedReauth, getCurrentUser } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-keys";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    const result = await getPgPool().query(
      `SELECT id, name, key_prefix AS "keyPrefix", scopes, expires_at AS "expiresAt", last_used_at AS "lastUsedAt", revoked_at AS "revokedAt", created_at AS "createdAt"
       FROM auth_api_keys WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at DESC`,
      [user.tenantId, user.id],
    );
    return Response.json({ keys: result.rows });
  } catch (error) {
    console.error("ELITZE API key list failed", error);
    return Response.json({ error: "api_key_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    if (!(await consumePrivilegedReauth(user))) return Response.json({ error: "recent_reauthentication_required" }, { status: 401 });
    const body = await request.json() as { name?: unknown; scopes?: unknown; expiresAt?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const scopes = Array.isArray(body.scopes) ? body.scopes.filter((v): v is string => typeof v === "string").slice(0, 50) : [];
    if (!name || name.length > 100) return Response.json({ error: "invalid_api_key_name" }, { status: 400 });
    const expiresAt = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null;
    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) return Response.json({ error: "invalid_api_key_expiry" }, { status: 400 });

    const key = generateApiKey();
    const result = await getPgPool().query(
      `INSERT INTO auth_api_keys (tenant_id,user_id,name,key_prefix,key_hash,scopes,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, key_prefix AS "keyPrefix", scopes, expires_at AS "expiresAt", created_at AS "createdAt"`,
      [user.tenantId, user.id, name, key.prefix, key.hash, scopes, expiresAt?.toISOString() ?? null],
    );
    return Response.json({ ok: true, key: key.raw, metadata: result.rows[0] });
  } catch (error) {
    console.error("ELITZE API key creation failed", error);
    return Response.json({ error: "api_key_unavailable" }, { status: 503 });
  }
}
