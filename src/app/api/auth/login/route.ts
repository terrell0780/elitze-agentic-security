import { NextRequest } from "next/server";
import { getPgPool } from "@/db";
import { assertSameOrigin, authenticate, consumeRateLimit, createSession, getRateLimitKey, issueMfaLoginChallenge } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!(await assertSameOrigin(request))) {
      return Response.json({ error: "csrf_rejected" }, { status: 403 });
    }
    const body = await request.json() as { email?: unknown; password?: unknown; persistent?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return Response.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const email = body.email.trim().toLowerCase();
    const rateLimitKey = await getRateLimitKey("login", email);
    if (!(await consumeRateLimit(rateLimitKey, 10))) {
      return Response.json({ error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "900" } });
    }

    const user = await authenticate(email, body.password);
    if (!user) return Response.json({ error: "invalid_credentials" }, { status: 401 });
    if (user.status !== "active") return Response.json({ error: "email_verification_required" }, { status: 403 });
    const security = await getPgPool().query(`SELECT mfa_required FROM auth_users WHERE id=$1 AND tenant_id=$2 LIMIT 1`, [user.id, user.tenantId]);
    if (security.rows[0]?.mfa_required) {
      await issueMfaLoginChallenge(user);
      return Response.json({ ok: true, mfaRequired: true });
    }
    await createSession(user, body.persistent !== false);
    return Response.json({ ok: true, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
  } catch (error) {
    console.error("ELITZE login failed", error);
    return Response.json({ error: "authentication_unavailable" }, { status: 503 });
  }
}
