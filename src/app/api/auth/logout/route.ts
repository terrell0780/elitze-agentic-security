import { logout } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST() { try { await logout(); return Response.json({ ok: true }); } catch { return Response.json({ error: "logout_unavailable" }, { status: 503 }); } }
