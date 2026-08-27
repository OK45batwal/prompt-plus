import { redirect } from "next/navigation";
import { getValidatedSession } from "@/lib/auth/get-session";
import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getValidatedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = !!(adminEmail && session.user.email === adminEmail);

  return <DashboardLayout isAdmin={isAdmin}><div className="animate-fade-in">{children}</div></DashboardLayout>;
}
