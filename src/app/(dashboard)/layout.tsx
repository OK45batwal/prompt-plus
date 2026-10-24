import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { verifySessionAccount } from "@/lib/auth/account";
import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";
import { SessionProvider } from "@/components/providers/session-provider";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    redirect("/login");
  }

  // A cleared cookie is not the only way a session ends: a revoked version or a deleted
  // account must stop protected pages too, not only the API.
  if (session?.user?.id) {
    const account = await verifySessionAccount(session.user.id, session.user.authVersion);
    if (!account.ok && account.status === 401) redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = !!(adminEmail && session?.user?.email === adminEmail);

  return (
    <SessionProvider session={session}>
      <DashboardLayout isAdmin={isAdmin}>
        <div className="animate-fade-in">{children}</div>
      </DashboardLayout>
    </SessionProvider>
  );
}
