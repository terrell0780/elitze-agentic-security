import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(5_000),
  aspectRatio: z.string().trim().max(20).optional(),
  resolution: z.enum(["1k", "2k"]).optional(),
});

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) {
    return Response.json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  if (!process.env.XAI_API_KEY?.trim()) return Response.json({ ok: false, error: "image_generation_not_configured" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-imagine-image-2.0",
      prompt: parsed.data.prompt,
      ...(parsed.data.aspectRatio ? { aspect_ratio: parsed.data.aspectRatio } : {}),
      ...(parsed.data.resolution ? { resolution: parsed.data.resolution } : {}),
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const bodyText = await response.text();
  if (!response.ok) return Response.json({ ok: false, error: "image_generation_failed" }, { status: 502 });

  let result: Record<string, unknown>;
  try { result = JSON.parse(bodyText) as Record<string, unknown>; } catch { return Response.json({ ok: false, error: "image_response_invalid" }, { status: 502 }); }

  return Response.json(
    { ok: true, agent: "ELITZE Super Agent", model: "grok-imagine-image-2.0", data: result.data ?? [] },
    { headers: { "cache-control": "no-store" } },
  );
}
