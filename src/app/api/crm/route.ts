import { getDb } from "@/db";
import { crmContacts, crmActions, topAgents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const [contacts, actions, agents] = await Promise.all([
      db.select().from(crmContacts).orderBy(desc(crmContacts.id)),
      db.select().from(crmActions).orderBy(desc(crmActions.createdAt)).limit(100),
      db.select().from(topAgents).orderBy(topAgents.tier, desc(topAgents.id)),
    ]);
    return NextResponse.json({ ok: true, contacts, actions, agents });
  } catch (error) {
    console.error("ELITZE CRM load failed", error);
    return NextResponse.json({ ok: false, error: "crm_unavailable" }, { status: 503 });
  }
}
