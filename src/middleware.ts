import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";

const nextAuthMiddleware = NextAuth(authConfig).auth;

export default nextAuthMiddleware((req) => {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({
    request: {
      headers: reqHeaders,
    },
  });

  res.headers.set("x-request-id", requestId);
  return res;
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/v1/:path*"],
};
