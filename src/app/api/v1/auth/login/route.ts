import { NextResponse } from "next/server";
import { assertSameOrigin, authenticate, consumeRateLimit, createSession, getRateLimitKey, issueMfaLoginChallenge } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) {
      return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
    }

    const body = await request.json() as { email?: unknown; password?: unknown; persistent?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }

    const email = body.email.trim().toLowerCase();
    if (!(await consumeRateLimit(await getRateLimitKey("login", email), 10))) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "900" } });
    }

    const user = await authenticate(email, body.password);
    if (!user) return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    if (user.status !== "active") {
      return NextResponse.json({ ok: false, error: "email_verification_required" }, { status: 403 });
    }

    const mfaRequired = await (async () => {
      const { getPgPool } = await import("@/db");
      const result = await getPgPool().query(
        "SELECT mfa_required FROM auth_users WHERE id=$1 AND tenant_id=$2 LIMIT 1",
        [user.id, user.tenantId],
      );
      return Boolean(result.rows[0]?.mfa_required);
    })();

    if (mfaRequired) {
      await issueMfaLoginChallenge(user);
      return NextResponse.json({ ok: true, mfaRequired: true });
    }

    await createSession(user, body.persistent !== false);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("ELITZE v1 login failed", error);
    return NextResponse.json({ ok: false, error: "authentication_unavailable" }, { status: 503 });
  }
}