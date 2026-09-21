import { assertSameOrigin, logout } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    await logout();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "logout_unavailable" }, { status: 503 });
  }
}
