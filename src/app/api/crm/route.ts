import { db } from "@/db";
import { crmContacts, crmActions, topAgents } from "@/db/schema";
import { ensureCrmSeeded } from "@/lib/crm-seed";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureCrmSeeded();
    const [contacts, actions, agents] = await Promise.all([
      db.select().from(crmContacts).orderBy(desc(crmContacts.id)),
      db.select().from(crmActions).orderBy(desc(crmActions.createdAt)).limit(12),
      db.select().from(topAgents).orderBy(topAgents.tier, desc(topAgents.id)),
    ]);
    return NextResponse.json({ ok: true, contacts, actions, agents });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
