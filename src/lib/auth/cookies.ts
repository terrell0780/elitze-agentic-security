import { cookies } from "next/headers";
import { createOpaqueToken } from "@/lib/auth/crypto";

export const SESSION_COOKIE = "elitze_session";
export const CSRF_COOKIE = "elitze_csrf";

const secure = process.env.NODE_ENV === "production";

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function ensureCsrfCookie(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;

  const token = createOpaqueToken(32);
  store.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return token;
}

export async function requireCsrf(request: Request): Promise<void> {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length || cookieToken !== headerToken) {
    throw new Error("CSRF validation failed.");
  }
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
