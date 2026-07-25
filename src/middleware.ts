import { decode } from "@auth/core/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-fallback-secret-key-32-chars";

function getTokenCookie(req: NextRequest): { token: string; salt: string } | null {
  for (const name of ["__Secure-authjs.session-token", "__Secure-next-auth.session-token", "authjs.session-token", "next-auth.session-token"]) {
    const value = req.cookies.get(name)?.value;
    if (value) return { token: value, salt: name };
  }
  return null;
}

export default async function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  if (isOnDashboard) {
    const cookie = getTokenCookie(req);
    if (!cookie) return NextResponse.redirect(new URL("/login", req.url));
    const payload = await decode({ token: cookie.token, secret, salt: cookie.salt }).catch(() => null);
    if (!payload) return NextResponse.redirect(new URL("/login", req.url));
  }

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("x-request-id", requestId);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/v1/:path*"],
};
