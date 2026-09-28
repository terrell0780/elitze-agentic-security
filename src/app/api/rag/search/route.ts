import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import {
  searchRag,
  publicRagError,
} from "@/lib/elitze-secure/rag";

const schema = z.object({
  query: z.string().trim().min(1).max(20_000),
  limit: z.number().int().min(1).max(20).optional(),
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
      { ok: false, error: "invalid_rag_query" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      ok: true,
      state: "RETRIEVED",
      sources: await searchRag(
        user.tenantId,
        parsed.data.query,
        parsed.data.limit,
      ),
    });
  } catch (error) {
    console.error("ELITZE RAG search failed", error);
    const mapped = publicRagError(error);
    return NextResponse.json(
      { ok: false, state: "UNAVAILABLE", error: mapped.code },
      { status: mapped.status },
    );
  }
}
