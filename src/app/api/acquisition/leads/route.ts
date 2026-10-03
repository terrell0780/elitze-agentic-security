import { NextRequest, NextResponse } from "next/server";
import { getPgPool } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAGES = ["NEW","QUALIFIED","NDA","DILIGENCE","OFFER","CONTRACT","CLOSED_WON","CLOSED_LOST"] as const;
type Stage = typeof STAGES[number];

function canManageLeads(user: { role: string; email: string }) {
  const configuredAdmin = process.env.ELITZE_ACQUISITION_ADMIN_EMAIL?.trim().toLowerCase();
  return user.role === "owner" || user.role === "admin" ||
    Boolean(configuredAdmin && user.email.toLowerCase() === configuredAdmin);
}

async function requireManager() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return { response: NextResponse.json({ ok:false, error:"authentication_required" }, { status:401 }) };
  if (!canManageLeads(user)) return { response: NextResponse.json({ ok:false, error:"acquisition_manager_required" }, { status:403 }) };
  return { user };
}

export async function GET() {
  const auth = await requireManager();
  if ("response" in auth) return auth.response;
  try {
    const result = await getPgPool().query(
      `SELECT id, request_type AS "requestType", stage, name, organization, email, message,
              source, notes, next_action_at AS "nextActionAt",
              converted_contact_id AS "convertedContactId",
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM acquisition_leads
        ORDER BY updated_at DESC
        LIMIT 200`,
    );
    return NextResponse.json({ ok:true, leads:result.rows });
  } catch (error) {
    console.error("ELITZE acquisition pipeline load failed", error);
    return NextResponse.json({ ok:false, error:"acquisition_pipeline_unavailable" }, { status:503 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireManager();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const stage = typeof body?.stage === "string" ? body.stage.trim().toUpperCase() as Stage : null;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 4000) : null;
  const nextActionAt = typeof body?.nextActionAt === "string" ? body.nextActionAt : null;

  if (!id || !stage || !STAGES.includes(stage)) return NextResponse.json({ ok:false, error:"invalid_pipeline_update" }, { status:400 });
  if (nextActionAt && Number.isNaN(Date.parse(nextActionAt))) return NextResponse.json({ ok:false, error:"invalid_next_action_at" }, { status:400 });

  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    const current = await client.query("SELECT stage FROM acquisition_leads WHERE id=$1 FOR UPDATE", [id]);
    if (current.rowCount !== 1) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok:false, error:"lead_not_found" }, { status:404 });
    }
    const fromStage = String(current.rows[0].stage);
    const updated = await client.query(
      `UPDATE acquisition_leads
          SET stage=$1, notes=COALESCE($2, notes), next_action_at=$3, updated_at=now()
        WHERE id=$4
        RETURNING id, request_type AS "requestType", stage, name, organization, email, message,
                  source, notes, next_action_at AS "nextActionAt",
                  converted_contact_id AS "convertedContactId",
                  created_at AS "createdAt", updated_at AS "updatedAt"`,
      [stage, note, nextActionAt, id],
    );
    if (fromStage !== stage) {
      await client.query(
        `INSERT INTO acquisition_lead_events (lead_id, from_stage, to_stage, actor_email, note)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, fromStage, stage, auth.user.email, note],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok:true, lead:updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("ELITZE acquisition pipeline update failed", error);
    return NextResponse.json({ ok:false, error:"acquisition_pipeline_unavailable" }, { status:503 });
  } finally {
    client.release();
  }
}
