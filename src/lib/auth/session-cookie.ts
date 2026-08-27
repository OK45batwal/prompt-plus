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
  const maxAge = 30 * 24 * 60 * 60; // 30 days

  const tokenPayload = {
    id: user.id,
    sub: user.id,
    name: user.name || null,
    email: user.email,
    picture: user.image || null,
    role: user.role || "user",
  };

  const cookieConfigs = [
    { name: "authjs.session-token", secure: false },
    { name: "__Secure-authjs.session-token", secure: isProd },
    { name: "next-auth.session-token", secure: false },
    { name: "__Secure-next-auth.session-token", secure: isProd },
  ];

  for (const config of cookieConfigs) {
    try {
      const token = await encode({
        token: tokenPayload,
        secret: authSecret,
        salt: config.name,
        maxAge,
      });

      res.cookies.set(config.name, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: config.secure,
        maxAge,
      });
    } catch {
      // Ignore individual cookie encoding failure
    }
  }

  return res;
}
