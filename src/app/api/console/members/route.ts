import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPgPool } from "@/db";
import { assertSameOrigin, consumeRateLimit, getCurrentUser, getRateLimitKey, normalizeEmail } from "@/lib/auth";
import { isReservedNonDeliverableEmail } from "@/lib/elitze-secure/auth-email-policy";
import { normalizeTenantRole } from "@/lib/elitze-secure/tenant-security";
import { sendAuthEmail } from "@/lib/auth-email";
import { productionConfig } from "@/config/production";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["admin", "member", "approver", "viewer"]),
}).strict();
const revokeSchema = z.object({ invitationId: z.string().uuid() }).strict();

function canManageMembers(role: string) {
  const normalized = normalizeTenantRole(role);
  return normalized === "OWNER" || normalized === "SECURITY_ADMIN";
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
}

function forbidden() {
  return NextResponse.json({ ok: false, error: "organization_member_management_forbidden" }, { status: 403, headers: privateHeaders });
}

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return unauthorized();
  if (!canManageMembers(user.role)) return forbidden();

  try {
    const db = getPgPool();
    const [members, invitations] = await Promise.all([
      db.query(
        `SELECT id,email,display_name AS "displayName",role,status,email_verified_at AS "emailVerifiedAt",
                last_login_at AS "lastLoginAt",created_at AS "createdAt"
         FROM auth_users WHERE tenant_id=$1 ORDER BY created_at ASC LIMIT 500`,
        [user.tenantId],
      ),
      db.query(
        `SELECT id,email,role,expires_at AS "expiresAt",created_at AS "createdAt",invited_by_user_id AS "invitedBy"
         FROM auth_tenant_invitations
         WHERE tenant_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()
         ORDER BY created_at DESC LIMIT 200`,
        [user.tenantId],
      ),
    ]);
    return NextResponse.json({ ok: true, tenantId: user.tenantId, members: members.rows, invitations: invitations.rows }, { headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE organization member listing failed", error);
    return NextResponse.json({ ok: false, error: "organization_members_unavailable" }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return unauthorized();
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403, headers: privateHeaders });
  if (!canManageMembers(user.role)) return forbidden();

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_invitation_payload" }, { status: 400, headers: privateHeaders });

  const email = normalizeEmail(parsed.data.email);
  if (isReservedNonDeliverableEmail(email)) return NextResponse.json({ ok: false, error: "deliverable_email_required" }, { status: 400, headers: privateHeaders });
  const role = normalizeTenantRole(user.role);
  if (role !== "OWNER" && parsed.data.role === "admin") return forbidden();

  if (!(await consumeRateLimit(await getRateLimitKey("tenant-invite", email), 10, 60 * 60))) {
    return NextResponse.json({ ok: false, error: "too_many_invitation_attempts" }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });
  }

  const db = getPgPool();
  try {
    const existing = await db.query("SELECT tenant_id FROM auth_users WHERE email_normalized=$1 LIMIT 1", [email]);
    if (existing.rows[0]) {
      return NextResponse.json({
        ok: false,
        error: existing.rows[0].tenant_id === user.tenantId ? "email_already_in_organization" : "email_already_associated_with_an_account",
      }, { status: 409, headers: privateHeaders });
    }
    const pending = await db.query(
      `SELECT id FROM auth_tenant_invitations
       WHERE tenant_id=$1 AND email_normalized=$2 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()
       LIMIT 1`,
      [user.tenantId, email],
    );
    if (pending.rows[0]) return NextResponse.json({ ok: false, error: "active_invitation_already_exists" }, { status: 409, headers: privateHeaders });

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    const created = await db.query(
      `INSERT INTO auth_tenant_invitations
        (tenant_id,email,email_normalized,role,invited_by_user_id,token_hash,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,role,expires_at AS "expiresAt"`,
      [user.tenantId, email, email, parsed.data.role, user.id, tokenHash, expiresAt.toISOString()],
    );

    const origin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || productionConfig.canonicalOrigin).replace(/\/$/, "");
    const inviteUrl = `${origin}/accept-invitation?token=${encodeURIComponent(rawToken)}`;
    try {
      await sendAuthEmail(
        email,
        "Invitation to join an ELITZE organization",
        `You have been invited to join an ELITZE organization. Complete account setup here: ${inviteUrl}\n\nThis link expires in seven days. If you were not expecting this invitation, you can ignore this email.`,
      );
    } catch (error) {
      await db.query("UPDATE auth_tenant_invitations SET revoked_at=now() WHERE id=$1 AND tenant_id=$2 AND accepted_at IS NULL", [created.rows[0].id, user.tenantId]);
      console.error("ELITZE invitation email delivery failed", error);
      return NextResponse.json({ ok: false, error: "invitation_email_delivery_failed" }, { status: 503, headers: privateHeaders });
    }

    return NextResponse.json({ ok: true, invitation: created.rows[0], status: "SENT" }, { status: 201, headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE organization invitation creation failed", error);
    return NextResponse.json({ ok: false, error: "organization_invitation_unavailable" }, { status: 503, headers: privateHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return unauthorized();
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403, headers: privateHeaders });
  if (!canManageMembers(user.role)) return forbidden();

  const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invitation_id_required" }, { status: 400, headers: privateHeaders });
  try {
    const result = await getPgPool().query(
      `UPDATE auth_tenant_invitations SET revoked_at=now()
       WHERE id=$1 AND tenant_id=$2 AND accepted_at IS NULL AND revoked_at IS NULL
       RETURNING id`,
      [parsed.data.invitationId, user.tenantId],
    );
    if (result.rowCount !== 1) return NextResponse.json({ ok: false, error: "active_invitation_not_found" }, { status: 404, headers: privateHeaders });
    return NextResponse.json({ ok: true, revoked: true }, { headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE organization invitation revocation failed", error);
    return NextResponse.json({ ok: false, error: "organization_invitation_unavailable" }, { status: 503, headers: privateHeaders });
  }
}
