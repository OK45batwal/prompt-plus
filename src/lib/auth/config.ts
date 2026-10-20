import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/prisma";
import { fallbackStore } from "@/lib/db/fallback-store";
import { loginSchema, logRejection } from "@/lib/validations/auth";
import { resolveOAuthUser, type OAuthProfile } from "@/lib/auth/oauth";
import { checkIpRateLimitAsync, extractClientIp } from "@/lib/rate-limit";

const configuredSecret = (
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.ENCRYPTION_KEY ||
  ""
).replace(/['"\r\n]/g, "").trim();

if (process.env.NODE_ENV === "production" && !configuredSecret) {
  throw new Error("CRITICAL SECURITY ERROR: AUTH_SECRET or NEXTAUTH_SECRET must be configured in production.");
}

const secret = configuredSecret || "development-secret-fallback-key-32chars";

if (!configuredSecret && process.env.NODE_ENV !== "test") {
  console.warn("⚠️ [AUTH] Running with insecure default development auth secret. Set AUTH_SECRET in your environment.");
}

process.env.AUTH_SECRET = secret;
process.env.NEXTAUTH_SECRET = secret;

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      // OAuth must resolve to a Prompt+ user before a session is issued.
      const resolved = await resolveOAuthUser(
        account.provider,
        account.providerAccountId,
        (profile || {}) as OAuthProfile
      );
      if (!resolved.ok) {
        throw new Error(
          resolved.reason === "unavailable"
            ? "AuthUnavailable"
            : resolved.reason === "email-in-use"
            ? "OAuthEmailInUse"
            : "OAuthEmailUnverified"
        );
      }

      const target = user as unknown as Record<string, unknown>;
      target.ppUserId = resolved.user.id;
      target.ppAuthVersion = resolved.user.authVersion;
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        const resolved = user as unknown as { ppUserId?: string; ppAuthVersion?: number; authVersion?: number };

        // A provider profile that never resolved to a database user must not become a session.
        if (account && account.provider !== "credentials" && !resolved.ppUserId) {
          throw new Error("OAuthUnresolved");
        }

        token.id = resolved.ppUserId || user.id;
        token.authVersion = resolved.ppAuthVersion ?? resolved.authVersion ?? 0;
        token.role = (user as { role?: string }).role || "user";
        token.email = user.email;
        token.name = user.name;
        const rawPic = (user as { image?: string }).image || (user as { avatar?: string }).avatar;
        token.picture = (rawPic && !rawPic.startsWith("data:") && rawPic.length < 500) ? rawPic : undefined;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      if (trigger === "update" && session?.user) {
        // Only profile fields a user may change. Never accept a role or version from the client.
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) {
          const rawPic = session.user.image;
          token.picture = (rawPic && !rawPic.startsWith("data:") && rawPic.length < 500) ? rawPic : undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub || "") as string;
        session.user.email = (token.email || session.user.email || "") as string;
        session.user.name = (token.name || session.user.name || "") as string;
        session.user.image = (token.picture || session.user.image || "") as string;
        session.user.role = (token.role as string) || "user";
        // Absent on tokens issued before revocation versioning: those must sign in again.
        if (typeof token.authVersion === "number") session.user.authVersion = token.authVersion;
      }
      return session;
    },
  },
  providers: [],
};

export function getProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    );
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }

  providers.push(
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          logRejection("login", parsed.error);
          return null;
        }

        // Throttle at the authorization boundary itself: a separate login page limit
        // cannot protect the Auth.js callback that actually checks passwords.
        const ip = request instanceof Request ? extractClientIp(request) : "unknown";
        const ipLimit = await checkIpRateLimitAsync(`login:ip:${ip}`, 10, 15 * 60 * 1000);
        if (!ipLimit.allowed) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        const emailLimit = await checkIpRateLimitAsync(`login:email:${normalizedEmail}`, 5, 15 * 60 * 1000);
        if (!emailLimit.allowed) return null;

        // 1. Try case-insensitive Prisma DB lookup
        let user: {
          id: string;
          email: string;
          name: string | null;
          avatar?: string | null;
          image?: string | null;
          passwordHash: string | null;
          emailVerified?: Date | null;
          deletedAt?: Date | null;
          authVersion?: number;
        } | null = null;

        let dbReachable = true;
        try {
          user = (await getDb().user.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: "insensitive",
              },
            },
          })) ?? (await getDb().user.findUnique({
            where: { email: normalizedEmail },
          }));
        } catch {
          dbReachable = false;
          user = null;
        }

        // 2. The local fallback store is a development convenience. In production an
        //    unreachable database must fail closed, never authenticate a local copy.
        if (!user && !dbReachable && process.env.NODE_ENV !== "production") {
          try {
            user = await fallbackStore.findUserByEmail(normalizedEmail);
          } catch {
            user = null;
          }
        }

        if (!user || !user.passwordHash || user.deletedAt) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Email ownership is established by the verification flow, never by a password login.
        try {
          await getDb().user
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => {});
        } catch {
          // DB update failure non-blocking
        }

        const rawAvatar = user.avatar || user.image || null;
        const safeAvatar = (rawAvatar && !rawAvatar.startsWith("data:") && rawAvatar.length < 500) ? rawAvatar : null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: safeAvatar,
          authVersion: user.authVersion ?? 0,
        };
      },
    })
  );

  return providers;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: getProviders(),
});

