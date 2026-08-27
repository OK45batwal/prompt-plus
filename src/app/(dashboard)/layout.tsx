import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { authSecret } from "@/lib/auth/session-cookie";
import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = await auth().catch(() => null);

  // Fallback direct JWT decode if NextAuth wrapper missed the cookie on edge routing
  if (!session?.user) {
    const cookieStore = await cookies();
    const tokenNames = [
      "__Secure-authjs.session-token",
      "authjs.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.session-token",
    ];

    for (const name of tokenNames) {
      const cookieVal = cookieStore.get(name)?.value;
      if (cookieVal) {
        try {
          const decoded = await decode({
            token: cookieVal,
            secret: authSecret,
            salt: name,
          });
          if (decoded && (decoded.email || decoded.id || decoded.sub)) {
            session = {
              user: {
                id: (decoded.id || decoded.sub || decoded.email) as string,
                email: (decoded.email || "") as string,
                name: (decoded.name || "") as string,
                image: (decoded.picture || null) as string | null,
              },
              expires: new Date(Date.now() + 30 * 86400000).toISOString(),
            };
            break;
          }
        } catch {
          // try next token name
        }
      }
    }
  }

  if (!session?.user) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = !!(adminEmail && session.user.email === adminEmail);

  return <DashboardLayout isAdmin={isAdmin}><div className="animate-fade-in">{children}</div></DashboardLayout>;
}
