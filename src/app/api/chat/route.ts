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
    const token = gatewayToken();
    const requireGatewayAuth = process.env.ELITZE_AI_GATEWAY_REQUIRE_AUTH !== "false";
    if (requireGatewayAuth && !token) {
      return NextResponse.json(
        { ok: false, state: "GATEWAY_AUTH_NOT_CONFIGURED", error: "Configured AI gateway requires an authorization secret. No model response was generated." },
        { status: 503 },
      );
    }

    const response = await fetch(`${gatewayUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
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
