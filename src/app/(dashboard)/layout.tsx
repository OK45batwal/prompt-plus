import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <DashboardLayout><div className="animate-fade-in">{children}</div></DashboardLayout>;
}
