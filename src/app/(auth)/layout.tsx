import { LiveBackground } from "@/components/ui/live-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background">
      <LiveBackground className="opacity-90 dark:opacity-85" />
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
