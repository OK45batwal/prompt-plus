import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.ENCRYPTION_KEY ||
  "promptplus-secure-auth-secret-fallback-key-32chars";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string;
}

/**
 * Encodes a NextAuth-compatible JWT session token and attaches it
 * to the response cookies. Works universally across HTTP and HTTPS.
 */
export async function attachSessionCookies(user: SessionUser, res: NextResponse): Promise<NextResponse> {
  const isProd = process.env.NODE_ENV === "production";
  const primaryCookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";
  const maxAge = 30 * 24 * 60 * 60; // 30 days

  // 1. Primary Encrypted Token
  const primaryToken = await encode({
    token: {
      id: user.id,
      sub: user.id,
      name: user.name || null,
      email: user.email,
      picture: user.image || null,
      role: user.role || "user",
    },
    secret: authSecret,
    salt: primaryCookieName,
    maxAge,
  });

  // 2. Fallback Encrypted Token for non-secure / proxy routing
  const fallbackToken = await encode({
    token: {
      id: user.id,
      sub: user.id,
      name: user.name || null,
      email: user.email,
      picture: user.image || null,
      role: user.role || "user",
    },
    secret: authSecret,
    salt: "authjs.session-token",
    maxAge,
  });

  // Set primary cookie
  res.cookies.set(primaryCookieName, primaryToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge,
  });

  // Set universal fallback cookie
  if (isProd) {
    res.cookies.set("authjs.session-token", fallbackToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge,
    });
  }

  return res;
}
