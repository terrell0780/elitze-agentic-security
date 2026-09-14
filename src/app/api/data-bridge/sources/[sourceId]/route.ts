import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dataBridgeSources } from "@/db/schema";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { sourceId } = await context.params;
  const body = (await request.json()) as { tenantId?: unknown; active?: unknown };
  if (typeof body.tenantId !== "string" || typeof body.active !== "boolean") return NextResponse.json({ ok: false, error: "tenant_id_and_active_required" }, { status: 400 });
  const [updated] = await getDb().update(dataBridgeSources).set({ active: body.active, updatedAt: new Date() }).where(and(eq(dataBridgeSources.id, sourceId), eq(dataBridgeSources.tenantId, body.tenantId))).returning({ id: dataBridgeSources.id, active: dataBridgeSources.active, updatedAt: dataBridgeSources.updatedAt });
  if (!updated) return NextResponse.json({ ok: false, error: "source_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, source: updated });
}
