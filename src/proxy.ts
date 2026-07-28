import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { nextUrl } = request;

  if (nextUrl.pathname.startsWith("/dashboard")) {
    const allCookies = request.cookies.getAll();
    const hasSessionCookie = allCookies.some((cookie) => {
      const name = cookie.name.toLowerCase();
      return name.includes("session-token") || name.includes("session_token");
    });

    if (!hasSessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

