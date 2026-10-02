import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import {
  createDailySecuritySnapshot,
  getLatestDailySecuritySnapshot,
  listDailySecuritySnapshots,
} from "@/lib/elitze-secure/daily-security-snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "1");
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 30) : 1;
    return NextResponse.json({
      ok: true,
      latest: await getLatestDailySecuritySnapshot(user.tenantId),
      snapshots: safeLimit > 1 ? await listDailySecuritySnapshots(user.tenantId, safeLimit) : undefined,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE daily snapshot read failed", error);
    return NextResponse.json({ ok: false, error: "daily_snapshot_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
  }

  try {
    const snapshot = await createDailySecuritySnapshot(user.tenantId);
    return NextResponse.json({ ok: true, state: "SNAPSHOTTED", snapshot }, { status: 201 });
  } catch (error) {
    console.error("ELITZE daily snapshot creation failed", error);
    return NextResponse.json({ ok: false, error: "daily_snapshot_failed" }, { status: 503 });
  }
}
