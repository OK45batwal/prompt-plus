import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = ["__Secure-authjs.session-token", "__Secure-next-auth.session-token", "authjs.session-token", "next-auth.session-token"];

export function proxy(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const hasCookie = SESSION_COOKIES.some(name => req.cookies.get(name)?.value);
    if (!hasCookie) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
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
