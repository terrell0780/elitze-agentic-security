import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { aiConnections } from "@/db/schema";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import {
  encryptIntegrationSecret,
  validateExternalHttpsUrl,
} from "@/lib/secure-integration-secrets";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(160),
  kind: z.enum(["model", "agent", "bot"]),
  baseUrl: z.string().trim().min(8).max(2000),
  model: z.string().trim().max(160).optional(),
  secret: z.string().min(1).max(8000),
  provider: z.enum(["OPENAI_COMPATIBLE", "NVIDIA_NIM"]).default("OPENAI_COMPATIBLE"),
});

function metadataFor(protocol: string, kind: string, provider: string) {
  return { protocol, kind, provider, secretStored: true, clientExposure: "never" };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

  try {
    const rows = await getDb().select({
      id: aiConnections.id,
      name: aiConnections.name,
      kind: aiConnections.kind,
      protocol: aiConnections.protocol,
      baseUrl: aiConnections.baseUrl,
      model: aiConnections.model,
      provider: aiConnections.metadata,
      enabled: aiConnections.enabled,
      createdAt: aiConnections.createdAt,
      updatedAt: aiConnections.updatedAt,
    }).from(aiConnections)
      .where(and(eq(aiConnections.tenantId, user.tenantId), eq(aiConnections.enabled, true)))
      .orderBy(desc(aiConnections.createdAt));

    return NextResponse.json({ ok: true, connections: rows });
  } catch {
    return NextResponse.json({ ok: false, error: "AI connection data plane unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid connection payload." }, { status: 400 });

  let url: URL;
  try {
    url = validateExternalHttpsUrl(parsed.data.baseUrl);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_external_url" },
      { status: 400 },
    );
  }

  const protocol = parsed.data.kind === "model"
    ? "OPENAI_COMPATIBLE"
    : parsed.data.kind === "agent"
      ? "ELITZE_AGENT"
      : "ELITZE_BOT";

  if (parsed.data.provider === "NVIDIA_NIM") {
    if (parsed.data.kind !== "model" || !parsed.data.model?.trim()) {
      return NextResponse.json({ ok: false, error: "nvidia_nim_requires_model_connection_and_model_id" }, { status: 400 });
    }
    const nimPath = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
    if (!nimPath.endsWith("/v1")) {
      return NextResponse.json({ ok: false, error: "nvidia_nim_base_url_must_end_in_v1" }, { status: 400 });
    }
  }

  try {
    const encryptedSecret = encryptIntegrationSecret(parsed.data.secret);
    const [connection] = await getDb().insert(aiConnections).values({
      tenantId: user.tenantId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      protocol,
      baseUrl: url.toString(),
      model: parsed.data.model || null,
      encryptedSecret,
      metadata: metadataFor(protocol, parsed.data.kind, parsed.data.provider),
      createdBy: user.id,
    }).returning({
      id: aiConnections.id,
      name: aiConnections.name,
      kind: aiConnections.kind,
      protocol: aiConnections.protocol,
      baseUrl: aiConnections.baseUrl,
      model: aiConnections.model,
      enabled: aiConnections.enabled,
    });

    await new AuditLedger().append(user.tenantId, "chat.ai_connection.created", {
      connectionId: connection.id,
      name: connection.name,
      kind: connection.kind,
      protocol: connection.protocol,
      provider: parsed.data.provider,
      baseUrl: connection.baseUrl,
    });

    return NextResponse.json({ ok: true, connection }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to store AI connection." },
      { status: 503 },
    );
  }
}
