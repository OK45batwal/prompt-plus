import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <Logo size={24} />
        <h1 className="text-6xl font-bold mt-6 tracking-tight">404</h1>
        <p className="text-sm text-muted-foreground mt-2">Page not found</p>
        <Link href="/" className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
          Go home
        </Link>
      </div>
    </div>
  );
}
