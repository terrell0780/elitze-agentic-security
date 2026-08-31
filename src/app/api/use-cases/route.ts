import { db } from "@/db";
import { agentIntegrations, godsEyeFindings, useCases } from "@/db/schema";
import { ensureUseCasesSeeded } from "@/lib/use-cases-seed";
import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureUseCasesSeeded();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const [cases, integrations, findings, stats] = await Promise.all([
      category
        ? db
            .select()
            .from(useCases)
            .where(eq(useCases.category, category))
            .orderBy(asc(useCases.sortOrder))
        : db.select().from(useCases).orderBy(asc(useCases.sortOrder)),
      db.select().from(agentIntegrations).orderBy(asc(agentIntegrations.id)),
      db
        .select()
        .from(godsEyeFindings)
        .orderBy(asc(godsEyeFindings.id)),
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
      industries: [
        "Financial Services",
        "Healthcare",
        "Government & Defense",
        "SaaS & Technology",
        "Retail & E-commerce",
        "Telecom",
        "Manufacturing",
        "MSSP / SOC",
      ],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to load use cases" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureUseCasesSeeded();
    const body = (await request.json()) as {
      action?: string;
      id?: number;
    };

    if (body.action === "resolve-finding" && body.id) {
      await db
        .update(godsEyeFindings)
        .set({ status: "resolved" })
        .where(eq(godsEyeFindings.id, body.id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Mutation failed" }, { status: 500 });
  }
}
