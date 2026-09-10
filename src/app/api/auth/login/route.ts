import { NextRequest } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown; persistent?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") return Response.json({ error: "invalid_credentials" }, { status: 401 });
    const user = await authenticate(body.email, body.password);
    if (!user) return Response.json({ error: "invalid_credentials" }, { status: 401 });
    if (user.status !== "active") return Response.json({ error: "email_verification_required" }, { status: 403 });
    await createSession(user, body.persistent !== false);
    return Response.json({ ok: true, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
  } catch (error) {
    console.error("ELITZE login failed", error);
    return Response.json({ error: "authentication_unavailable" }, { status: 503 });
  }
}
