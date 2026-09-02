import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json(
      { ok: true, service: "elitze-agentic-security", checks: { database: "ok" } },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, service: "elitze-agentic-security", checks: { database: "unavailable" } },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
