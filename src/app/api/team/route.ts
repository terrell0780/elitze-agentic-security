import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { teamChannelMembers, teamChannels, teamMessages } from "@/db/schema";
import { getTeamSession } from "@/lib/team/session";

const channelSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  channelType: z.enum(["team", "incident", "decision", "project"]).default("team"),
});

const messageSchema = z.object({
  channelId: z.number().int().positive(),
  body: z.string().trim().min(1).max(10000),
  replyToId: z.number().int().positive().optional(),
  linkedDecisionId: z.number().int().positive().optional(),
  linkedEvidenceId: z.number().int().positive().optional(),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "channel";
}

export async function GET(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });

  try {
    const db = getDb();
    const channelId = Number(request.nextUrl.searchParams.get("channelId") || 0);

    if (channelId) {
      const membership = await db.select({ id: teamChannelMembers.id }).from(teamChannelMembers)
        .where(and(eq(teamChannelMembers.channelId, channelId), eq(teamChannelMembers.actorId, session.actorId), isNull(teamChannelMembers.leftAt))).limit(1);
      if (!membership.length) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });

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
      }).from(teamMessages).where(and(eq(teamMessages.channelId, channelId), isNull(teamMessages.deletedAt))).orderBy(desc(teamMessages.createdAt)).limit(200);
      return NextResponse.json({ ok: true, channelId, messages: messages.reverse() });
    }

    const channels = await db.select({
      id: teamChannels.id,
      slug: teamChannels.slug,
      name: teamChannels.name,
      description: teamChannels.description,
      channelType: teamChannels.channelType,
      incidentId: teamChannels.incidentId,
      createdBy: teamChannels.createdBy,
      createdAt: teamChannels.createdAt,
    }).from(teamChannels)
      .innerJoin(teamChannelMembers, eq(teamChannelMembers.channelId, teamChannels.id))
      .where(and(eq(teamChannelMembers.actorId, session.actorId), isNull(teamChannelMembers.leftAt), isNull(teamChannels.archivedAt)))
      .orderBy(asc(teamChannels.name));

    return NextResponse.json({ ok: true, actorId: session.actorId, channels });
  } catch {
    return NextResponse.json({ ok: false, error: "Team data plane unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });

  const input = channelSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ ok: false, error: "Invalid channel payload." }, { status: 400 });

  try {
    const db = getDb();
    const baseSlug = slugify(input.data.name);
    let slug = baseSlug;
    for (let suffix = 2; ; suffix += 1) {
      const existing = await db.select({ id: teamChannels.id }).from(teamChannels).where(eq(teamChannels.slug, slug)).limit(1);
      if (!existing.length) break;
      slug = `${baseSlug}-${suffix}`;
    }

    const [channel] = await db.insert(teamChannels).values({
      slug,
      name: input.data.name,
      description: input.data.description || null,
      channelType: input.data.channelType,
      createdBy: session.actorId,
    }).returning({ id: teamChannels.id, slug: teamChannels.slug, name: teamChannels.name, channelType: teamChannels.channelType });

    await db.insert(teamChannelMembers).values({ channelId: channel.id, actorId: session.actorId, role: "owner" });
    return NextResponse.json({ ok: true, channel }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to create channel." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });

  const input = messageSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ ok: false, error: "Invalid message payload." }, { status: 400 });

  try {
    const db = getDb();
    const membership = await db.select({ id: teamChannelMembers.id }).from(teamChannelMembers)
      .where(and(eq(teamChannelMembers.channelId, input.data.channelId), eq(teamChannelMembers.actorId, session.actorId), isNull(teamChannelMembers.leftAt))).limit(1);
    if (!membership.length) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });

    const [message] = await db.insert(teamMessages).values({
      channelId: input.data.channelId,
      authorId: session.actorId,
      authorType: "human",
      body: input.data.body,
      replyToId: input.data.replyToId ?? null,
      linkedDecisionId: input.data.linkedDecisionId ?? null,
      linkedEvidenceId: input.data.linkedEvidenceId ?? null,
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
