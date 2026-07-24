import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnApiV1 = nextUrl.pathname.startsWith("/api/v1");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      if (isOnApiV1) {
        if (isLoggedIn) return true;
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
};
