import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listWorkforce } from "@/lib/elitze-secure/agent-workforce-db";
import { toObsidianDashboard, toObsidianProfile } from "@/lib/elitze-secure/agent-workforce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const workforce = await listWorkforce(user.tenantId);
    if (request.nextUrl.searchParams.get("format") === "obsidian") {
      const markdown = workforce.map((agent) => toObsidianProfile(agent)).join("\n---\n\n");
      return new NextResponse(markdown, {
        status: 200,
        headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (request.nextUrl.searchParams.get("format") === "obsidian-dashboard") {
      return new NextResponse(toObsidianDashboard(), {
        status: 200,
        headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return NextResponse.json({ ok: true, workforce });
  } catch (error) {
    console.error("ELITZE agent workforce listing failed", error);
    return NextResponse.json({ ok: false, error: "agent_workforce_unavailable" }, { status: 503 });
  }
}
