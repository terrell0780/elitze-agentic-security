import { getDb } from "@/db";
import { dataSources, insights } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const sourcesData = await db.select().from(dataSources).orderBy(desc(dataSources.id));
    const insightsQuery = db.select().from(insights).orderBy(desc(insights.createdAt));
    const insightsData = kind
      ? await insightsQuery.where(eq(insights.kind, kind))
      : await insightsQuery;

    return NextResponse.json({ ok: true, tenantId: user.tenantId, sources: sourcesData, insights: insightsData }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("ELITZE data hub load failed", error);
    return NextResponse.json({ ok: false, error: "data_hub_unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
