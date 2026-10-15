import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { chatAttachments, teamChannels } from "@/db/schema";
import { evaluatePolicy } from "@/lib/security/policy";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  try {
    const rows = await getDb().select({
      id: chatAttachments.id,
      fileName: chatAttachments.fileName,
      contentType: chatAttachments.contentType,
      sizeBytes: chatAttachments.sizeBytes,
      sha256: chatAttachments.sha256,
      scanState: chatAttachments.scanState,
      content: chatAttachments.content,
    }).from(chatAttachments)
      .innerJoin(teamChannels, eq(teamChannels.id, chatAttachments.channelId))
      .where(and(
        eq(chatAttachments.id, id),
        eq(chatAttachments.tenantId, user.tenantId),
        eq(teamChannels.tenantId, user.tenantId),
        isNull(teamChannels.archivedAt),
      ))
      .limit(1);

    const row = rows[0];
    if (!row) return NextResponse.json({ ok: false, error: "Attachment not found." }, { status: 404 });

    const decision = evaluatePolicy({
      actorId: user.id,
      actorType: "human",
      requestedAction: "chat.file.download",
      purpose: "Governed attachment download",
      dataClass: "internal",
    });
    if (decision.decision !== "allow") return NextResponse.json({ ok: false, state: "BLOCKED", decision }, { status: 403 });

    await new AuditLedger().append(user.tenantId, "chat.file.downloaded", {
      attachmentId: row.id,
      fileName: row.fileName,
      sizeBytes: row.sizeBytes,
      sha256: row.sha256,
      scanState: row.scanState,
    });

    return new NextResponse(new Uint8Array(row.content).buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "content-type": row.contentType,
        "content-length": String(row.sizeBytes),
        "content-disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(row.fileName),
        "x-elitze-sha256": row.sha256,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-elitze-malware-scan": "not-performed",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Attachment data plane unavailable." }, { status: 503 });
  }
}
