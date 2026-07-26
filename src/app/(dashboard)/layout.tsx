import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout><div className="animate-fade-in">{children}</div></DashboardLayout>;
}
