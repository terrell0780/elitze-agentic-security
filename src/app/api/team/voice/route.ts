import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { teamChannelMembers, teamChannels, teamVoicePresence, teamVoiceSignals } from "@/db/schema";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import { evaluatePolicy } from "@/lib/security/policy";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

const joinSchema = z.object({
  channelId: z.number().int().positive(),
  displayName: z.string().trim().max(200).optional(),
});
const signalSchema = z.object({
  channelId: z.number().int().positive(),
  toActorId: z.string().trim().min(1).max(200),
  signalType: z.enum(["offer", "answer", "candidate", "bye"]),
  payload: z.record(z.string(), z.unknown()),
});
const leaveSchema = z.object({ channelId: z.number().int().positive() });

async function member(channelId: number, userId: string, tenantId: string) {
  const rows = await getDb().select({ id: teamChannelMembers.id })
    .from(teamChannelMembers)
    .innerJoin(teamChannels, eq(teamChannels.id, teamChannelMembers.channelId))
    .where(and(
      eq(teamChannelMembers.channelId, channelId),
      eq(teamChannelMembers.actorId, userId),
      eq(teamChannels.tenantId, tenantId),
      isNull(teamChannelMembers.leftAt),
      isNull(teamChannels.archivedAt),
    ))
    .limit(1);
  return rows.length > 0;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const channelId = Number(request.nextUrl.searchParams.get("channelId") ?? 0);
  if (!Number.isInteger(channelId) || channelId <= 0) return NextResponse.json({ ok: false, error: "channelId is required." }, { status: 400 });

  try {
    if (!await member(channelId, user.id, user.tenantId)) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });
    const db = getDb();
    const presence = await db.select({
      actorId: teamVoicePresence.actorId,
      displayName: teamVoicePresence.displayName,
      joinedAt: teamVoicePresence.joinedAt,
      lastSeenAt: teamVoicePresence.lastSeenAt,
    }).from(teamVoicePresence)
      .where(and(
        eq(teamVoicePresence.channelId, channelId),
        eq(teamVoicePresence.tenantId, user.tenantId),
        isNull(teamVoicePresence.leftAt),
      ))
      .orderBy(asc(teamVoicePresence.joinedAt));

    const signals = await db.select({
      id: teamVoiceSignals.id,
      fromActorId: teamVoiceSignals.fromActorId,
      signalType: teamVoiceSignals.signalType,
      payload: teamVoiceSignals.payload,
      createdAt: teamVoiceSignals.createdAt,
    }).from(teamVoiceSignals)
      .where(and(
        eq(teamVoiceSignals.channelId, channelId),
        eq(teamVoiceSignals.tenantId, user.tenantId),
        eq(teamVoiceSignals.toActorId, user.id),
        isNull(teamVoiceSignals.consumedAt),
        gt(teamVoiceSignals.expiresAt, new Date()),
      ))
      .orderBy(asc(teamVoiceSignals.createdAt))
      .limit(100);

    if (signals.length) {
      await db.update(teamVoiceSignals)
        .set({ consumedAt: new Date() })
        .where(and(
          eq(teamVoiceSignals.tenantId, user.tenantId),
          eq(teamVoiceSignals.channelId, channelId),
          eq(teamVoiceSignals.toActorId, user.id),
          isNull(teamVoiceSignals.consumedAt),
        ));
    }

    await db.update(teamVoicePresence)
      .set({ lastSeenAt: new Date() })
      .where(and(
        eq(teamVoicePresence.channelId, channelId),
        eq(teamVoicePresence.tenantId, user.tenantId),
        eq(teamVoicePresence.actorId, user.id),
        isNull(teamVoicePresence.leftAt),
      ));

    return NextResponse.json({ ok: true, presence, signals }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Voice signaling data plane unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    const db = getDb();

    if (action === "join") {
      const input = joinSchema.safeParse(body);
      if (!input.success) return NextResponse.json({ ok: false, error: "Invalid voice join payload." }, { status: 400 });
      if (!await member(input.data.channelId, user.id, user.tenantId)) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });

      const decision = evaluatePolicy({
        actorId: user.id,
        actorType: "human",
        requestedAction: "team.voice.join",
        purpose: "Tenant team voice channel",
        dataClass: "internal",
      });
      if (decision.decision !== "allow") return NextResponse.json({ ok: false, state: "BLOCKED", decision }, { status: 403 });

      await db.update(teamVoicePresence)
        .set({ leftAt: new Date() })
        .where(and(
          eq(teamVoicePresence.channelId, input.data.channelId),
          eq(teamVoicePresence.tenantId, user.tenantId),
          eq(teamVoicePresence.actorId, user.id),
          isNull(teamVoicePresence.leftAt),
        ));

      const [row] = await db.insert(teamVoicePresence).values({
        tenantId: user.tenantId,
        channelId: input.data.channelId,
        actorId: user.id,
        displayName: input.data.displayName || user.email,
      }).returning({
        actorId: teamVoicePresence.actorId,
        displayName: teamVoicePresence.displayName,
        joinedAt: teamVoicePresence.joinedAt,
      });

      await new AuditLedger().append(user.tenantId, "team.voice.joined", {
        channelId: input.data.channelId,
        actorId: user.id,
      });

      return NextResponse.json({ ok: true, actorId: user.id, presence: row });
    }

    if (action === "leave") {
      const input = leaveSchema.safeParse(body);
      if (!input.success) return NextResponse.json({ ok: false, error: "Invalid voice leave payload." }, { status: 400 });
      if (!await member(input.data.channelId, user.id, user.tenantId)) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });
      await db.update(teamVoicePresence)
        .set({ leftAt: new Date() })
        .where(and(
          eq(teamVoicePresence.channelId, input.data.channelId),
          eq(teamVoicePresence.tenantId, user.tenantId),
          eq(teamVoicePresence.actorId, user.id),
          isNull(teamVoicePresence.leftAt),
        ));
      await new AuditLedger().append(user.tenantId, "team.voice.left", { channelId: input.data.channelId, actorId: user.id });
      return NextResponse.json({ ok: true });
    }

    const input = signalSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ ok: false, error: "Invalid voice signal payload." }, { status: 400 });
    if (!await member(input.data.channelId, user.id, user.tenantId)) return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });
    if (!await member(input.data.channelId, input.data.toActorId, user.tenantId)) return NextResponse.json({ ok: false, error: "Target participant is not a channel member." }, { status: 403 });

    const decision = evaluatePolicy({
      actorId: user.id,
      actorType: "human",
      requestedAction: "team.voice.signal",
      purpose: "Tenant WebRTC signaling",
      dataClass: "internal",
    });
    if (decision.decision !== "allow") return NextResponse.json({ ok: false, state: "BLOCKED", decision }, { status: 403 });

    const [row] = await db.insert(teamVoiceSignals).values({
      tenantId: user.tenantId,
      channelId: input.data.channelId,
      fromActorId: user.id,
      toActorId: input.data.toActorId,
      signalType: input.data.signalType,
      payload: input.data.payload,
      expiresAt: new Date(Date.now() + 30_000),
    }).returning({ id: teamVoiceSignals.id });

    return NextResponse.json({ ok: true, signalId: row.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to process voice request." }, { status: 503 });
  }
}
