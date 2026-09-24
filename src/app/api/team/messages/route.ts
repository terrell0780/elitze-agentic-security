import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { teamChannelMembers, teamChannels, teamMessages } from "@/db/schema";
import { getTeamSession } from "@/lib/team/session";

const querySchema = z.object({ channelId: z.coerce.number().int().positive() });
const bodySchema = z.object({
  channelId: z.number().int().positive(),
  body: z.string().trim().min(1).max(10000),
  replyToId: z.number().int().positive().optional(),
  linkedDecisionId: z.number().int().positive().optional(),
  linkedEvidenceId: z.number().int().positive().optional(),
});

async function authorizedChannel(channelId: number, actorId: string, tenantId: string) {
  const db = getDb();
  const membership = await db.select({ id: teamChannelMembers.id }).from(teamChannelMembers)
    .innerJoin(teamChannels, eq(teamChannels.id, teamChannelMembers.channelId))
    .where(and(eq(teamChannelMembers.channelId, channelId), eq(teamChannelMembers.actorId, actorId), eq(teamChannels.tenantId, tenantId), isNull(teamChannelMembers.leftAt), isNull(teamChannels.archivedAt))).limit(1);
  return membership.length > 0;
}

export async function GET(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "channelId is required." }, { status: 400 });

  try {
    if (!await authorizedChannel(parsed.data.channelId, session.actorId, session.tenantId)) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });
    const db = getDb();
    const messages = await db.select({
      id: teamMessages.id,
      authorId: teamMessages.authorId,
      authorType: teamMessages.authorType,
      body: teamMessages.body,
      replyToId: teamMessages.replyToId,
      linkedDecisionId: teamMessages.linkedDecisionId,
      linkedEvidenceId: teamMessages.linkedEvidenceId,
      createdAt: teamMessages.createdAt,
      editedAt: teamMessages.editedAt,
    }).from(teamMessages)
      .innerJoin(teamChannels, eq(teamChannels.id, teamMessages.channelId))
      .where(and(eq(teamMessages.channelId, parsed.data.channelId), eq(teamChannels.tenantId, session.tenantId), isNull(teamMessages.deletedAt)))
      .orderBy(desc(teamMessages.createdAt)).limit(200);
    return NextResponse.json({ ok: true, messages: messages.reverse() });
  } catch {
    return NextResponse.json({ ok: false, error: "Team message data plane unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid message payload." }, { status: 400 });

  try {
    if (!await authorizedChannel(parsed.data.channelId, session.actorId, session.tenantId)) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });
    const db = getDb();
    const [message] = await db.insert(teamMessages).values({
      channelId: parsed.data.channelId,
      authorId: session.actorId,
      authorType: "human",
      body: parsed.data.body,
      replyToId: parsed.data.replyToId ?? null,
      linkedDecisionId: parsed.data.linkedDecisionId ?? null,
      linkedEvidenceId: parsed.data.linkedEvidenceId ?? null,
    }).returning({
      id: teamMessages.id,
      channelId: teamMessages.channelId,
      authorId: teamMessages.authorId,
      authorType: teamMessages.authorType,
      body: teamMessages.body,
      replyToId: teamMessages.replyToId,
      linkedDecisionId: teamMessages.linkedDecisionId,
      linkedEvidenceId: teamMessages.linkedEvidenceId,
      createdAt: teamMessages.createdAt,
    });
    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to write team message." }, { status: 503 });
  }
}
