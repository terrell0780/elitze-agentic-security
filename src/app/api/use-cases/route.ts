import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { agentIntegrations, godsEyeFindings, useCases } from "@/db/schema";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const category = new URL(request.url).searchParams.get("category")?.trim();
    const [cases, integrations, findings, stats] = await Promise.all([
      category
        ? db.select().from(useCases).where(eq(useCases.category, category)).orderBy(asc(useCases.sortOrder))
        : db.select().from(useCases).orderBy(asc(useCases.sortOrder)),
      db.select().from(agentIntegrations).orderBy(asc(agentIntegrations.id)),
      db.select().from(godsEyeFindings).orderBy(asc(godsEyeFindings.id)),
      db.execute(sql`
        SELECT
          (SELECT count(*) FROM use_cases) AS use_cases,
          (SELECT count(*) FROM use_cases WHERE featured = true) AS featured,
          (SELECT count(*) FROM agent_integrations) AS integrations,
          (SELECT count(*) FROM gods_eye_findings WHERE status = 'open') AS open_findings,
          (SELECT count(*) FROM gods_eye_findings WHERE severity IN ('critical','high')) AS high_findings
      `),
    ]);
    const s = (stats.rows[0] ?? {}) as Record<string, string | number>;
    return NextResponse.json({
      ok: true,
      stats: {
        useCases: Number(s.use_cases ?? 0),
        featured: Number(s.featured ?? 0),
        integrations: Number(s.integrations ?? 0),
        openFindings: Number(s.open_findings ?? 0),
        highFindings: Number(s.high_findings ?? 0),
      },
      useCases: cases,
      integrations,
      findings,
    });
  } catch (error) {
    console.error("ELITZE use-case data load failed", error);
    return NextResponse.json({ ok: false, error: "use_case_data_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const { action, id } = body as { action?: unknown; id?: unknown };
  if (action !== "resolve-finding" || !Number.isInteger(id) || Number(id) < 1) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }
  try {
    await getDb().update(godsEyeFindings).set({ status: "resolved" }).where(eq(godsEyeFindings.id, id as number));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ELITZE finding mutation failed", error);
    return NextResponse.json({ ok: false, error: "mutation_failed" }, { status: 503 });
  }
}
