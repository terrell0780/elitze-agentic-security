import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductionReadiness } from "@/lib/production-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow, nosnippet",
};

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "authentication_required" },
      { status: 401, headers: privateHeaders },
    );
  }

  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403, headers: privateHeaders },
    );
  }

  try {
    const readiness = await getProductionReadiness();
    return NextResponse.json(
      { ok: true, readiness },
      { status: readiness.releaseBlocked ? 503 : 200, headers: privateHeaders },
    );
  } catch (error) {
    console.error("ELITZE production readiness request failed", error);
    return NextResponse.json(
      { ok: false, error: "readiness_unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
}
