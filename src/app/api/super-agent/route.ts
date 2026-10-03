import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { runSuperAgent, type SuperAgentMode } from "@/lib/elitze-super-agent";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  mode: z.enum(["auto", "deep-research", "security-analyst", "code", "creative", "evidence"]).default("auto"),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(30_000),
  })).min(1).max(20),
});

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) {
    return Response.json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await runSuperAgent({
      user,
      mode: parsed.data.mode as SuperAgentMode,
      messages: parsed.data.messages,
    });
    return Response.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "super_agent_failed";
    const status = /XAI_API_KEY is missing|not configured/i.test(message) ? 503 : 502;
    return Response.json({ ok: false, error: message }, { status, headers: { "cache-control": "no-store" } });
  }
}
