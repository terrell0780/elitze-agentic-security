import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import {
  indexDocument,
  publicRagError,
} from "@/lib/elitze-secure/rag";

const schema = z.object({
  contentId: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(500),
  sourceType: z.string().trim().min(1).max(80),
  sourceUri: z.string().trim().max(4000).nullable().optional(),
  content: z.string().trim().min(1).max(1_000_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "authentication_required" },
      { status: 401 },
    );
  }

  if (!(await assertSameOrigin(request))) {
    return NextResponse.json(
      { ok: false, error: "csrf_rejected" },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_rag_document" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      ok: true,
      state: "INDEXED",
      ...(await indexDocument({
        tenantId: user.tenantId,
        ...parsed.data,
      })),
    });
  } catch (error) {
    console.error("ELITZE RAG document indexing failed", error);
    const mapped = publicRagError(error);
    return NextResponse.json(
      { ok: false, state: "UNAVAILABLE", error: mapped.code },
      { status: mapped.status },
    );
  }
}
