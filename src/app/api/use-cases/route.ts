import { getDb } from "@/db";
import { agentIntegrations, godsEyeFindings, useCases } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

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
      industries: ["Financial services", "Healthcare", "Government", "SaaS and technology", "Retail and commerce", "Telecommunications", "Manufacturing", "Security operations"],
    });
  } catch (error) {
    console.error("ELITZE use-case load failed", error);
    return NextResponse.json({ ok: false, error: "use_cases_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ ok: false, error: "mutation_requires_internal_control_plane" }, { status: 401 });
}
