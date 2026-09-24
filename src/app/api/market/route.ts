import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The legacy market endpoint exposed non-tenant-scoped tables.
 * It is intentionally closed rather than silently serving cross-tenant data.
 * Tenant operational state is served by /api/console/overview.
 */
function retired() {
  return NextResponse.json(
    {
      ok: false,
      error: "legacy_market_endpoint_retired",
      reason: "tenant_scoped_data_plane_required",
      replacement: "/api/console/overview",
      evidenceState: "UNAVAILABLE",
    },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(_request: NextRequest) {
  return retired();
}

export async function POST(_request: NextRequest) {
  return retired();
}
