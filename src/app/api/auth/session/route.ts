import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await getCurrentUser();
    return Response.json({ authenticated: Boolean(user), user: user ? { id: user.id, tenantId: user.tenantId, email: user.email, displayName: user.displayName, role: user.role } : null });
  } catch { return Response.json({ authenticated: false, user: null }, { status: 503 }); }
}
