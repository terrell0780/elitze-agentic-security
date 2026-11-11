import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/console", "/workspace"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const protectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!protectedRoute || request.cookies.has("elitze_session")) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/console/:path*", "/workspace/:path*"],
};
