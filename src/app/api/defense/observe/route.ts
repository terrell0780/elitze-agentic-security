import { NextRequest } from "next/server";
import { createElitzeAgent } from "@/lib/elitze-secure/elitze-agent";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const tenantId = request.headers.get("x-elitze-tenant");
  if (!tenantId?.trim()) {
    return Response.json({ ok: false, error: "tenant required" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const query = request.nextUrl.searchParams.get("q") ?? undefined;
  const signals = await createElitzeAgent().observe(tenantId, query);
  return Response.json(
    { ok: true, tenantId, count: signals.length, signals },
    { headers: { "cache-control": "no-store" } },
  );
}
