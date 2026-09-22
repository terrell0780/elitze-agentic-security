import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { teamChannels, teamChannelMembers, teamMessages } from "@/db/schema";
import { getTeamSession } from "@/lib/team/session";
import { evaluatePolicy } from "@/lib/security/policy";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(20000),
  channelId: z.number().int().positive().optional(),
  dataClass: z.enum(["public", "internal", "confidential", "restricted"]).default("internal"),
});

type ChatCompletion = { choices?: Array<{ message?: { content?: string } }> };

function gatewayToken() {
  const direct = process.env.ELITZE_AI_GATEWAY_TOKEN?.trim();
  if (direct) return direct;

  const secretFile = process.env.ELITZE_AI_GATEWAY_TOKEN_FILE?.trim();
  if (!secretFile) return "";
  if (!secretFile.startsWith("/run/secrets/")) return "";

  try {
    return fs.readFileSync(secretFile, "utf8").trim();
  } catch {
    return "";
  }
}

async function channelMembership(channelId: number, actorId: string) {
  const db = getDb();
  const rows = await db.select({ id: teamChannelMembers.id }).from(teamChannelMembers)
    .where(and(eq(teamChannelMembers.channelId, channelId), eq(teamChannelMembers.actorId, actorId), isNull(teamChannelMembers.leftAt))).limit(1);
  return rows.length > 0;
}

async function findOrCreateAssistantChannel(actorId: string) {
  const db = getDb();
  const existing = await db.select({ id: teamChannels.id }).from(teamChannels)
    .innerJoin(teamChannelMembers, eq(teamChannelMembers.channelId, teamChannels.id))
    .where(and(eq(teamChannelMembers.actorId, actorId), isNull(teamChannelMembers.leftAt), eq(teamChannels.channelType, "assistant"), isNull(teamChannels.archivedAt))).limit(1);
  if (existing.length) return existing[0].id;

  const slug = `assistant-${actorId.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}-${Date.now().toString(36)}`;
  const [channel] = await db.insert(teamChannels).values({
    slug,
    name: "ELITZE Chat",
    description: "Governed AI conversation channel",
    channelType: "assistant",
    createdBy: actorId,
  }).returning({ id: teamChannels.id });
  await db.insert(teamChannelMembers).values({ channelId: channel.id, actorId, role: "owner" });
  return channel.id;
}

export async function POST(request: NextRequest) {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid chat payload." }, { status: 400 });

  const db = getDb();
  const channelId = parsed.data.channelId ?? await findOrCreateAssistantChannel(session.actorId);
  if (parsed.data.channelId && !await channelMembership(channelId, session.actorId)) {
    return NextResponse.json({ ok: false, error: "Channel membership required." }, { status: 403 });
  }

  const gatewayUrl = process.env.ELITZE_AI_GATEWAY_URL?.trim();
  if (!gatewayUrl) {
    return NextResponse.json({ ok: false, state: "UNAVAILABLE", error: "ELITZE_AI_GATEWAY_URL is not configured. No model response was generated." }, { status: 503 });
  }

  const decision = evaluatePolicy({
    actorId: session.actorId,
    actorType: "human",
    requestedAction: "chat.generate",
    purpose: "Security analysis and governed assistant response",
    dataClass: parsed.data.dataClass,
  });
  if (decision.decision !== "allow") return NextResponse.json({ ok: false, state: "BLOCKED", decision }, { status: 403 });

  try {
    const response = await fetch(`${gatewayUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(gatewayToken() ? { authorization: `Bearer ${gatewayToken()}` } : {}),
      },
      body: JSON.stringify({
        model: process.env.ELITZE_AI_MODEL || "default",
        messages: [
          { role: "system", content: "You are ELITZE Agentic Security's governed security assistant. Be explicit about uncertainty, distinguish evidence from inference, and never invent live security telemetry." },
          { role: "user", content: parsed.data.message },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    const payload = await response.json().catch(() => null) as ChatCompletion | null;
    if (!response.ok) return NextResponse.json({ ok: false, state: "UPSTREAM_ERROR", error: "Configured AI gateway rejected the request." }, { status: 502 });
    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) return NextResponse.json({ ok: false, state: "INVALID_UPSTREAM_RESPONSE", error: "Configured AI gateway returned no assistant content." }, { status: 502 });

    await db.insert(teamMessages).values({ channelId, authorId: session.actorId, authorType: "human", body: parsed.data.message });
    const [assistantMessage] = await db.insert(teamMessages).values({ channelId, authorId: "elitze-assistant", authorType: "assistant", body: answer }).returning({ id: teamMessages.id, createdAt: teamMessages.createdAt });

    return NextResponse.json({ ok: true, state: "GENERATED", answer, decision, messageId: assistantMessage.id });
  } catch {
    return NextResponse.json({ ok: false, state: "UPSTREAM_UNAVAILABLE", error: "Configured AI gateway is unavailable." }, { status: 503 });
  }
}
