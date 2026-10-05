import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { teamspeakIntegrations } from "@/db/schema";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { encryptIntegrationSecret, validateExternalHttpsUrl } from "@/lib/secure-integration-secrets";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(160),
  webqueryUrl: z.string().trim().min(8).max(2000),
  apiKey: z.string().min(1).max(8000),
  serverId: z.number().int().positive().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  try {
    const rows = await getDb().select({
      id: teamspeakIntegrations.id,
      name: teamspeakIntegrations.name,
      webqueryUrl: teamspeakIntegrations.webqueryUrl,
      serverId: teamspeakIntegrations.serverId,
      enabled: teamspeakIntegrations.enabled,
      lastState: teamspeakIntegrations.lastState,
      lastCheckedAt: teamspeakIntegrations.lastCheckedAt,
      createdAt: teamspeakIntegrations.createdAt,
      updatedAt: teamspeakIntegrations.updatedAt,
    }).from(teamspeakIntegrations)
      .where(and(eq(teamspeakIntegrations.tenantId, user.tenantId), eq(teamspeakIntegrations.enabled, true)))
      .orderBy(desc(teamspeakIntegrations.createdAt));
    return NextResponse.json({ ok: true, integrations: rows }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "TeamSpeak integration data plane unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid TeamSpeak configuration." }, { status: 400 });

  let url: URL;
  try {
    url = validateExternalHttpsUrl(parsed.data.webqueryUrl);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "invalid_external_url" }, { status: 400 });
  }

  try {
    const [integration] = await getDb().insert(teamspeakIntegrations).values({
      tenantId: user.tenantId,
      name: parsed.data.name,
      webqueryUrl: url.toString(),
      encryptedApiKey: encryptIntegrationSecret(parsed.data.apiKey),
      serverId: parsed.data.serverId ?? null,
      enabled: true,
      lastState: "CONFIGURED",
      createdBy: user.id,
    }).returning({
      id: teamspeakIntegrations.id,
      name: teamspeakIntegrations.name,
      webqueryUrl: teamspeakIntegrations.webqueryUrl,
      serverId: teamspeakIntegrations.serverId,
      enabled: teamspeakIntegrations.enabled,
      lastState: teamspeakIntegrations.lastState,
    });

    await new AuditLedger().append(user.tenantId, "teamspeak.integration.configured", {
      integrationId: integration.id,
      name: integration.name,
      webqueryUrl: integration.webqueryUrl,
      serverId: integration.serverId,
    });

    return NextResponse.json({
      ok: true,
      integration,
      state: "CONFIGURED",
      note: "The API key is encrypted at rest and is never returned. Connection verification requires an authorized TeamSpeak Web Query endpoint and is not represented as connected until tested.",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to configure TeamSpeak." }, { status: 503 });
  }
}
