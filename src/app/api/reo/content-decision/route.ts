import { NextRequest } from "next/server";
import { assessContent } from "@/lib/elitze-reo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    return Response.json(assessContent(input));
  } catch {
    return Response.json({ error: "invalid_reo_request" }, { status: 400 });
  }
}
