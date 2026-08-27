import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { loginSchema, logRejection } from "@/lib/validations/auth";

const secret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.ENCRYPTION_KEY ||
  "promptplus-secure-auth-secret-fallback-key-32chars";

process.env.AUTH_SECRET = secret;
process.env.NEXTAUTH_SECRET = secret;
process.env.AUTH_TRUST_HOST = "true";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "user";
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = (token.id || token.sub || session.user?.email) as string;
      if (session.user) {
        session.user.id = userId;
        (session.user as { role?: string }).role = (token.role as string) || "user";
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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          logRejection("login", parsed.error);
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        let user = null;
        try {
          user = await getDb().user.findFirst({
            where: { email: { equals: normalizedEmail, mode: "insensitive" } },
          });
          if (!user) {
            user = await getDb().user.findUnique({
              where: { email: normalizedEmail },
            });
          }
        } catch {
          const { fallbackStore } = await import("@/lib/db/fallback-store");
          user = await fallbackStore.findUserByEmail(normalizedEmail);
        }

        if (!user) {
          const passwordHash = await bcrypt.hash(password, 12);
          try {
            const dbUser = await getDb().user.create({
              data: {
                name: normalizedEmail.split("@")[0],
                email: normalizedEmail,
                passwordHash,
                provider: "email",
                emailVerified: new Date(),
                onboardingCompleted: true,
              },
            });
            user = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              avatar: dbUser.avatar,
              passwordHash: dbUser.passwordHash,
              emailVerified: dbUser.emailVerified,
            };
          } catch {
            const { fallbackStore } = await import("@/lib/db/fallback-store");
            const fbUser = await fallbackStore.createUser({
              name: normalizedEmail.split("@")[0],
              email: normalizedEmail,
              passwordHash,
              provider: "email",
              emailVerified: new Date(),
              onboardingCompleted: true,
            });
            user = {
              id: fbUser.id,
              email: fbUser.email,
              name: fbUser.name,
              avatar: fbUser.avatar,
              passwordHash: fbUser.passwordHash,
              emailVerified: fbUser.emailVerified,
            };
          }
        } else {
          if (!user.passwordHash) {
            const passwordHash = await bcrypt.hash(password, 12);
            try {
              await getDb().user.update({
                where: { id: user.id },
                data: { passwordHash, emailVerified: new Date() },
              });
            } catch {
              const { fallbackStore } = await import("@/lib/db/fallback-store");
              await fallbackStore.updateUser({ id: user.id }, { passwordHash, emailVerified: new Date() });
            }
          } else {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
              return null;
            }
          }
        }

        try {
          if (!user.emailVerified) {
            await getDb().user.update({
              where: { id: user.id },
              data: { emailVerified: new Date(), resetToken: null },
            }).catch(() => {});
          }

          await getDb().user
            .update({
              where: { id: user.id },
              data: { updatedAt: new Date(), lastLoginAt: new Date() },
            })
            .catch(() => {});
        } catch {
          // Ignore
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
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

