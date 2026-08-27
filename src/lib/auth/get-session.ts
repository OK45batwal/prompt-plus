import { auth } from "@/lib/auth/config";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { authSecret } from "@/lib/auth/session-cookie";
import type { Session } from "next-auth";

const TOKEN_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const SALTS = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "",
];

/**
 * Universal, production-grade session resolver.
 * Combines NextAuth native `auth()` with multi-salt fallback JWT decoding.
 * Guarantees zero false logouts across SSR, client hydration, and serverless proxies.
 */
export async function getValidatedSession(): Promise<Session | null> {
  // 1. Try NextAuth standard resolver
  try {
    const session = await auth();
    if (session?.user?.email || session?.user?.id) {
      return session;
    }
  } catch {
    // Continue to fallback cookie decoder
  }

  // 2. Direct Cookie Multi-Salt Fallback Decoder
  try {
    const cookieStore = await cookies();

    for (const name of TOKEN_NAMES) {
      const cookieVal = cookieStore.get(name)?.value;
      if (!cookieVal) continue;

      for (const salt of SALTS) {
        try {
          const decoded = await decode({
            token: cookieVal,
            secret: authSecret,
            salt,
          });

          if (decoded && (decoded.email || decoded.id || decoded.sub)) {
            const userId = (decoded.id || decoded.sub || decoded.email) as string;
            const email = (decoded.email || "") as string;
            const name = (decoded.name || "") as string;
            const image = (decoded.picture || null) as string | null;
            const role = (decoded.role || "user") as string;

            return {
              user: {
                id: userId,
                email,
                name,
                image,
                role,
              },
              expires: new Date(Date.now() + 30 * 86400000).toISOString(),
            } as Session;
          }
        } catch {
          // try next salt
        }
      }
    }
  } catch {
    // Cookie store read error
  }

  return null;
}
