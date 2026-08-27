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

        try {
          const user = await getDb().user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return null;
          }

          // Auto-verify email on successful password authentication
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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };
        } catch (dbError) {
          console.error("Authorize database error:", dbError);
          return null;
        }
      },
    })
  );

  return providers;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: getProviders(),
});

