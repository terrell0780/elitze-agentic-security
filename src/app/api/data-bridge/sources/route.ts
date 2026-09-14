import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { getDb } from "@/db";
import { dataBridgeSources } from "@/db/schema";
import { provisionSource } from "@/lib/elitze-secure/data-bridge";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  if (!tenantId) return NextResponse.json({ ok: false, error: "tenant_id_required" }, { status: 400 });
  const rows = await getDb().select({ id: dataBridgeSources.id, name: dataBridgeSources.name, slug: dataBridgeSources.slug, kind: dataBridgeSources.kind, description: dataBridgeSources.description, tokenPrefix: dataBridgeSources.tokenPrefix, active: dataBridgeSources.active, lastIngestAt: dataBridgeSources.lastIngestAt, eventsAccepted: dataBridgeSources.eventsAccepted, createdAt: dataBridgeSources.createdAt, updatedAt: dataBridgeSources.updatedAt }).from(dataBridgeSources).where(eq(dataBridgeSources.tenantId, tenantId)).orderBy(asc(dataBridgeSources.name));
  return NextResponse.json({ ok: true, sources: rows });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as { tenantId?: unknown; name?: unknown; kind?: unknown; description?: unknown };
    if (typeof body.tenantId !== "string" || typeof body.name !== "string" || typeof body.kind !== "string") {
      return NextResponse.json({ ok: false, error: "tenant_id_name_kind_required" }, { status: 400 });
    }
    const result = await provisionSource({ tenantId: body.tenantId, name: body.name, kind: body.kind, description: typeof body.description === "string" ? body.description : undefined });
    return NextResponse.json({ ok: true, source: { ...result.source, tokenHash: undefined }, token: result.token, warning: "Store this token securely. ELITZE does not return it again." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "source_provision_failed" }, { status: 400 });
  }
}
