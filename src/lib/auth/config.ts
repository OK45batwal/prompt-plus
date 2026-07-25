import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { authConfig } from "@/lib/auth/auth.config";
import { getDb } from "@/lib/db/prisma";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !secret) {
  throw new Error(
    "FATAL: NEXTAUTH_SECRET or AUTH_SECRET must be defined in production environment variables."
  );
}

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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

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

        await getDb().user
          .update({
            where: { id: user.id },
            data: { updatedAt: new Date() },
          })
          .catch(() => {});

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
  secret: secret || "development-fallback-secret-key-32-chars",
  trustHost: true,
  providers: getProviders(),
  session: {
    strategy: "jwt",
  },
});

