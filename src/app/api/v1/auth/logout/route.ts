import { NextResponse } from "next/server";
import { assertSameOrigin, logout } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) {
      return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
    }
    await logout();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Logout rejected." }, { status: 403 });
  }
}