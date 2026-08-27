import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { loginSchema, logRejection } from "@/lib/validations/auth";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-secret-fallback-key-32chars";
if (process.env.NODE_ENV === "production" && (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET)) {
  throw new Error(
    "FATAL: AUTH_SECRET or NEXTAUTH_SECRET environment variable is missing for production deployment."
  );
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "user";
        token.email = user.email;
        token.name = user.name;
        token.picture = (user as { image?: string }).image || (user as { avatar?: string }).avatar;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub || "") as string;
        session.user.email = (token.email || session.user.email || "") as string;
        session.user.name = (token.name || session.user.name || "") as string;
        session.user.image = (token.picture || session.user.image || "") as string;
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

        const user = await getDb().user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Auto-verify email upon valid password login if verification was pending
        if (user.resetToken?.startsWith("ev:") && !user.emailVerified) {
          await getDb().user
            .update({
              where: { id: user.id },
              data: { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null, lastLoginAt: new Date() },
            })
            .catch(() => {});
        } else {
          await getDb().user
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => {});
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

