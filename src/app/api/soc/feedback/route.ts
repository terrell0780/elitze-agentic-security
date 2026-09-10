import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { analystFeedback } from "@/db/schema";
import { getTeamSession } from "@/lib/team/session";

const bodySchema = z.object({
  decisionId: z.number().int().positive().optional(),
  verdict: z.enum(["malicious", "benign", "uncertain", "confirmed_malicious", "confirmed_benign"]),
  comment: z.string().trim().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid analyst feedback payload." }, { status: 400 });

  try {
    const db = getDb();
    const [feedback] = await db.insert(analystFeedback).values({
      decisionId: parsed.data.decisionId ?? null,
      analystId: session.actorId,
      verdict: parsed.data.verdict,
      comment: parsed.data.comment || null,
    }).returning({ id: analystFeedback.id, decisionId: analystFeedback.decisionId, verdict: analystFeedback.verdict, createdAt: analystFeedback.createdAt });
    return NextResponse.json({ ok: true, feedback }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to record analyst feedback." }, { status: 503 });
  }
}
