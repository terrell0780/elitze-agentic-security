import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformOwner } from "@/lib/platform-owner";
import { getProductionReadiness } from "@/lib/production-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, {
      status: 401,
      headers: { "cache-control": "private, no-store" },
    });
  }
  if (!isPlatformOwner(user)) {
    return NextResponse.json({ ok: false, error: "platform_owner_required" }, {
      status: 403,
      headers: { "cache-control": "private, no-store" },
    });
  }

  const readiness = await getProductionReadiness();
  return NextResponse.json({ ok: true, readiness }, {
    status: readiness.releaseBlocked ? 503 : 200,
    headers: { "cache-control": "private, no-store" },
  });
}
