import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center px-4 border-b">
        <Link href="/"><Logo size={20} /></Link>
      </header>
      <main className="flex-1 max-w-2xl mx-auto p-6 space-y-4 text-sm text-muted-foreground">
        <h1 className="text-xl font-bold text-foreground">Terms of Service</h1>
        <p>By using Prompt+, you agree to these terms. Prompt+ provides AI prompt enhancement services. You are responsible for the content you submit and how you use the enhanced output.</p>
        <h2 className="text-base font-semibold text-foreground">Usage</h2>
        <p>You may not use Prompt+ for any illegal purpose or to generate harmful content. We reserve the right to limit or terminate access if these terms are violated.</p>
        <h2 className="text-base font-semibold text-foreground">Contact Information</h2>
        <p>For questions or concerns regarding these Terms of Service, email us at <a href="mailto:promptplus2@gmail.com" className="text-primary hover:underline font-medium">promptplus2@gmail.com</a>.</p>
        <p className="text-xs mt-8">Last updated: July 2026</p>
      </main>
    </div>
  );
}
