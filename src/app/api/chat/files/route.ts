import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { chatAttachments, teamChannels } from "@/db/schema";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import { evaluatePolicy } from "@/lib/security/policy";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_BATCH_BYTES = MAX_FILE_BYTES * 6;
const MAX_FILES_PER_REQUEST = 6;
const blockedExtensions = new Set([
  "exe","dll","sys","scr","msi","com","bat","cmd","ps1","psm1","vbs","vbe","js","jse",
  "wsf","wsh","hta","jar","apk","appx","dmg","iso","reg","php","phtml","phar","php3",
  "php4","php5","php7","phps","cgi","pl","sh","bash","zsh","py","rb","html","htm",
  "svg","htaccess","pif","msp","mst",
]);

type PreparedAttachment = {
  file: File;
  bytes: Uint8Array;
  sha256: string;
};

async function authorizedChannel(channelId: number, tenantId: string) {
  const rows = await getDb().select({ id: teamChannels.id })
    .from(teamChannels)
    .where(and(
      eq(teamChannels.id, channelId),
      eq(teamChannels.tenantId, tenantId),
      isNull(teamChannels.archivedAt),
    ))
    .limit(1);
  return rows.length > 0;
}

function extension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BATCH_BYTES + 64 * 1024) {
    return NextResponse.json({ ok: false, error: "upload_batch_too_large", limitBytes: MAX_BATCH_BYTES }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "invalid_multipart_upload" }, { status: 400 });
  const channelId = Number(form.get("channelId") ?? 0);
  const rawFiles = form?.getAll("files").filter((value): value is File => value instanceof File) ?? [];

  if (!Number.isInteger(channelId) || channelId <= 0) return NextResponse.json({ ok: false, error: "channelId is required." }, { status: 400 });
  if (rawFiles.length < 1 || rawFiles.length > MAX_FILES_PER_REQUEST) return NextResponse.json({ ok: false, error: "Attach between 1 and 6 files." }, { status: 400 });
  if (!await authorizedChannel(channelId, user.tenantId)) return NextResponse.json({ ok: false, error: "Tenant channel access required." }, { status: 403 });

  const decision = evaluatePolicy({
    actorId: user.id,
    actorType: "human",
    requestedAction: "chat.file.upload",
    purpose: "Governed attachment upload",
    dataClass: "internal",
  });
  if (decision.decision !== "allow") return NextResponse.json({ ok: false, state: "BLOCKED", decision }, { status: 403 });

  // Validate the entire batch before storage. Attachments are not content-scanned.
  for (const file of rawFiles) {
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: "file_size_out_of_range", limitBytes: MAX_FILE_BYTES }, { status: 413 });
    }
    if (blockedExtensions.has(extension(file.name))) {
      return NextResponse.json({ ok: false, error: "blocked_executable_or_active_content_extension" }, { status: 415 });
    }
  }

  const prepared: PreparedAttachment[] = await Promise.all(rawFiles.map(async (file) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return {
      file,
      bytes,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
  }));

  const results = [];
  for (const item of prepared) {
    const { file, bytes, sha256 } = item;
    const [row] = await getDb().insert(chatAttachments).values({
      tenantId: user.tenantId,
      channelId,
      uploadedBy: user.id,
      fileName: file.name.slice(0, 300),
      contentType: "application/octet-stream",
      sizeBytes: file.size,
      sha256,
      scanState: "NOT_SCANNED",
      content: Buffer.from(bytes),
    }).returning({
      id: chatAttachments.id,
      fileName: chatAttachments.fileName,
      contentType: chatAttachments.contentType,
      sizeBytes: chatAttachments.sizeBytes,
      sha256: chatAttachments.sha256,
      scanState: chatAttachments.scanState,
      createdAt: chatAttachments.createdAt,
    });

    await new AuditLedger().append(user.tenantId, "chat.file.uploaded", {
      attachmentId: row.id,
      channelId,
      fileName: row.fileName,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      sha256: row.sha256,
      scanState: row.scanState,
    });

    results.push(row);
  }

  return NextResponse.json({
    ok: true,
    state: "STORED",
    attachmentCount: results.length,
    attachments: results,
    fileHandling: {
      state: "NOT_SCANNED",
      checks: ["size", "extension", "tenant authorization", "policy authorization", "SHA-256 integrity"],
    },
    securityNote: "Attachment bytes are stored without content scanning. Upload only files from trusted sources.",
  }, { status: 201, headers: { "cache-control": "no-store" } });
}
