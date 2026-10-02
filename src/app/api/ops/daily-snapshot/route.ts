import { NextRequest, NextResponse } from "next/server";
import { getPgPool } from "@/db";
import { createDailySecuritySnapshot } from "@/lib/elitze-secure/daily-security-snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const header = request.headers.get("authorization")?.trim();
  return header === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const tenants = await getPgPool().query("SELECT id FROM auth_tenants ORDER BY id");
    const results = [];
    for (const tenant of tenants.rows) {
      results.push(await createDailySecuritySnapshot(String(tenant.id)));
    }

    return NextResponse.json({
      ok: true,
      state: "SNAPSHOTTED",
      tenantCount: results.length,
      snapshots: results,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE scheduled daily snapshot failed", error);
    return NextResponse.json({ ok: false, error: "daily_snapshot_job_failed" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
