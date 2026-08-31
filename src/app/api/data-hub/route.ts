import { db } from "@/db";
import { dataSources, insights } from "@/db/schema";
import { ensureDataHubSeeded } from "@/lib/data-hub-seed";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureDataHubSeeded();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");

    const [sourcesData, insightsData] = await Promise.all([
      db.select().from(dataSources).orderBy(dataSources.id),
      kind
        ? db.select().from(insights).where(kind ? undefined : undefined).orderBy(insights.createdAt)
        : db.select().from(insights).orderBy(insights.createdAt),
    ]);

    // Re-query with filter if needed (simple ORM limitation handled via JS filter for demo clarity)
    const insightsFiltered = kind
      ? insightsData.filter((i: { kind: string }) => i.kind === kind)
      : insightsData;

    return NextResponse.json({
      ok: true,
      sources: sourcesData,
      insights: insightsFiltered,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Hub load failed" }, { status: 500 });
  }
}
