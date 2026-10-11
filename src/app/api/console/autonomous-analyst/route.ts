import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import { getPgPool } from "@/db";
import { runAgenticSocGraph as runAutonomousAnalyst } from "@/lib/elitze-secure/agentic-soc-graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = getPgPool();
    const run = await db.query(
      "SELECT id,status,evidence_state AS \"evidenceState\",started_at AS \"startedAt\",completed_at AS \"completedAt\",summary " +
      "FROM autonomous_analyst_runs WHERE tenant_id=$1 ORDER BY started_at DESC,id DESC LIMIT 1",
      [user.tenantId],
    );
    const latestRun = run.rows[0] ?? null;
    const findings = latestRun
      ? await db.query(
        "SELECT id,title,severity,confidence,evidence_state AS \"evidenceState\",subject_key AS \"subjectKey\", " +
        "technique_ids AS \"techniqueIds\",source_refs AS \"sourceRefs\",supporting_event_ids AS \"supportingEventIds\", " +
        "gaps,proposed_actions AS \"proposedActions\",action_state AS \"actionState\",created_at AS \"createdAt\" " +
        "FROM autonomous_analyst_findings WHERE tenant_id=$1 AND run_id=$2 ORDER BY created_at DESC LIMIT 20",
        [user.tenantId, latestRun.id],
      )
      : { rows: [] };

    return NextResponse.json({
      ok: true,
      run: latestRun,
      findings: findings.rows,
    });
  } catch (error) {
    console.error("ELITZE autonomous analyst load failed", error);
    return NextResponse.json(
      { ok: false, error: "autonomous_analyst_unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!(await assertSameOrigin(request))) {
    return NextResponse.json(
      { ok: false, error: "csrf_rejected" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    trigger?: "MANUAL" | "SCHEDULED" | "EVENT";
  };

  if (body.trigger && !["MANUAL", "SCHEDULED", "EVENT"].includes(body.trigger)) {
    return NextResponse.json(
      { ok: false, error: "invalid_trigger" },
      { status: 400 },
    );
  }

  try {
    const result = await runAutonomousAnalyst(
      user.tenantId,
      user.id,
      body.trigger ?? "MANUAL",
    );
    return NextResponse.json({ ok: true, ...result }, { status: 202 });
  } catch (error) {
    console.error("ELITZE autonomous analyst run failed", error);
    return NextResponse.json(
      { ok: false, error: "autonomous_analyst_failed" },
      { status: 503 },
    );
  }
}
