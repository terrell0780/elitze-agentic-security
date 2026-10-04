import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/auth/service";
import { ensureCsrfCookie, setSessionCookie } from "@/lib/auth/cookies";

const schema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await loginUser(input.email, input.password);
    await setSessionCookie(result.sessionToken);
    const csrf = await ensureCsrfCookie();
    return NextResponse.json({ ok: true, user: result.user, csrfToken: csrf });
  } catch {
    return NextResponse.json({ ok: false, error: "Authentication failed." }, { status: 401 });
  }
}
