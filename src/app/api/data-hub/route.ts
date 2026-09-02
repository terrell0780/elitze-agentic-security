import { getDb } from "@/db";
import { dataSources, insights } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const kind = new URL(request.url).searchParams.get("kind")?.trim();
    const [sources, rows] = await Promise.all([
      db.select().from(dataSources).orderBy(asc(dataSources.id)),
      kind ? db.select().from(insights).where(eq(insights.kind, kind)).orderBy(desc(insights.createdAt)) : db.select().from(insights).orderBy(desc(insights.createdAt)),
    ]);
    return NextResponse.json({ ok: true, sources, insights: rows });
  } catch (error) {
    console.error("ELITZE data hub load failed", error);
    return NextResponse.json({ ok: false, error: "data_hub_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: false, error: "data_hub_mutation_not_supported" }, { status: 405 });
}
