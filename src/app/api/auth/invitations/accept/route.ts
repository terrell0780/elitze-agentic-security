import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { PoolClient } from "pg";
import { getPgPool } from "@/db";
import { assertSameOrigin, consumeRateLimit, createSession, getRateLimitKey, hashPassword, normalizeEmail } from "@/lib/auth";
import { normalizeTenantRole } from "@/lib/elitze-secure/tenant-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12).max(256),
  displayName: z.string().trim().max(160).optional(),
}).strict();

export async function POST(request: NextRequest) {
  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403, headers: privateHeaders });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "valid_invitation_token_password_and_optional_name_required" }, { status: 400, headers: privateHeaders });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const db = getPgPool();
  let preview;
  try {
    preview = await db.query(
      `SELECT email_normalized FROM auth_tenant_invitations
       WHERE token_hash=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()
       LIMIT 1`,
      [tokenHash],
    );
  } catch (error) {
    console.error("ELITZE invitation lookup failed", error);
    return NextResponse.json({ ok: false, error: "invitation_service_unavailable" }, { status: 503, headers: privateHeaders });
  }
  if (!preview.rows[0]) {
    return NextResponse.json({ ok: false, error: "invitation_invalid_or_expired" }, { status: 400, headers: privateHeaders });
  }
  const email = normalizeEmail(String(preview.rows[0].email_normalized));
  let rateAllowed: boolean;
  try {
    rateAllowed = await consumeRateLimit(await getRateLimitKey("invitation-accept", email), 5, 60 * 60);
  } catch (error) {
    console.error("ELITZE invitation rate-limit check failed", error);
    return NextResponse.json({ ok: false, error: "invitation_service_unavailable" }, { status: 503, headers: privateHeaders });
  }
  if (!rateAllowed) {
    return NextResponse.json({ ok: false, error: "too_many_invitation_attempts" }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(parsed.data.password);
  } catch {
    return NextResponse.json({ ok: false, error: "password_policy" }, { status: 400, headers: privateHeaders });
  }

  let client: PoolClient;
  try { client = await db.connect(); } catch (error) { console.error("ELITZE invitation transaction unavailable", error); return NextResponse.json({ ok: false, error: "invitation_service_unavailable" }, { status: 503, headers: privateHeaders }); }
  let user: { id: string; tenantId: string; email: string; displayName: string | null; role: string; status: string } | null = null;
  try {
    await client.query("BEGIN");
    // Serialize account creation by email across simultaneous invitations/registrations.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [email]);
    const invitationResult = await client.query(
      `SELECT id,tenant_id AS "tenantId",email,email_normalized AS "emailNormalized",role
       FROM auth_tenant_invitations
       WHERE token_hash=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()
       LIMIT 1 FOR UPDATE`,
      [tokenHash],
    );
    const invitation = invitationResult.rows[0];
    if (!invitation || normalizeEmail(String(invitation.emailNormalized)) !== email) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "invitation_invalid_or_expired" }, { status: 400, headers: privateHeaders });
    }

    const existing = await client.query("SELECT id FROM auth_users WHERE email_normalized=$1 LIMIT 1", [email]);
    if (existing.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "email_already_associated_with_an_account" }, { status: 409, headers: privateHeaders });
    }

    const created = await client.query(
      `INSERT INTO auth_users
        (tenant_id,email,email_normalized,password_hash,display_name,role,status,email_verified_at)
       VALUES ($1,$2,$3,$4,$5,$6,'active',now())
       RETURNING id,tenant_id AS "tenantId",email,display_name AS "displayName",role,status`,
      [invitation.tenantId, invitation.email, email, passwordHash, parsed.data.displayName?.trim() || null, invitation.role],
    );
    const consume = await client.query(
      `UPDATE auth_tenant_invitations SET accepted_at=now()
       WHERE id=$1 AND tenant_id=$2 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()
       RETURNING id`,
      [invitation.id, invitation.tenantId],
    );
    if (consume.rowCount !== 1) throw new Error("invitation_consume_conflict");
    user = created.rows[0];
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("ELITZE invitation acceptance failed", error);
    return NextResponse.json({ ok: false, error: "invitation_acceptance_unavailable" }, { status: 503, headers: privateHeaders });
  } finally {
    client.release();
  }

  if (!user) return NextResponse.json({ ok: false, error: "invitation_acceptance_unavailable" }, { status: 503, headers: privateHeaders });
  // Convert the just-persisted account role through the shared vocabulary before session creation.
  if (!normalizeTenantRole(user.role)) {
    console.error("ELITZE invitation contained an unsupported persisted role");
    return NextResponse.json({ ok: false, error: "invitation_role_invalid" }, { status: 503, headers: privateHeaders });
  }
  try {
    await createSession(user, true);
  } catch (error) {
    console.error("ELITZE invitation account created but session creation failed", error);
    return NextResponse.json({ ok: true, status: "ACCOUNT_CREATED_SIGN_IN_REQUIRED" }, { status: 201, headers: privateHeaders });
  }
  return NextResponse.json({ ok: true, status: "INVITATION_ACCEPTED", user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } }, { status: 201, headers: privateHeaders });
}
