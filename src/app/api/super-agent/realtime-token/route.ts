import { assertSameOrigin, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) {
    return Response.json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  if (!process.env.XAI_API_KEY?.trim()) {
    return Response.json({ ok: false, error: "voice_not_configured" }, { status: 503 });
  }

  const response = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expires_after: { seconds: 300 } }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = await response.text();
  if (!response.ok) {
    return Response.json({ ok: false, error: "voice_token_failed" }, { status: 502 });
  }

  let parsed: { value?: string; expires_at?: number };
  try {
    parsed = JSON.parse(body) as { value?: string; expires_at?: number };
  } catch {
    return Response.json({ ok: false, error: "voice_token_invalid" }, { status: 502 });
  }

  if (!parsed.value) {
    return Response.json({ ok: false, error: "voice_token_missing" }, { status: 502 });
  }

  return Response.json(
    {
      ok: true,
      token: parsed.value,
      expiresAt: parsed.expires_at ?? null,
      model: "grok-voice-latest",
      agent: "ELITZE Super Agent",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
