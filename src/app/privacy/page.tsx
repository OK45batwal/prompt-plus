import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center px-4 border-b">
        <Link href="/"><Logo size={20} /></Link>
      </header>
      <main className="flex-1 max-w-2xl mx-auto p-6 space-y-4 text-sm text-muted-foreground">
        <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
        <p>Your privacy matters. Prompt+ processes your prompts only to provide the enhancement service. We do not sell, share, or store your prompts beyond what is necessary to deliver the service.</p>
        <h2 className="text-base font-semibold text-foreground">Data We Collect</h2>
        <p>Account information (email, name) and prompt text you submit for enhancement. API keys you provide are encrypted at rest.</p>
        <h2 className="text-base font-semibold text-foreground">Data Retention</h2>
        <p>Prompt history is retained for your convenience. You can delete individual prompts or your entire account at any time.</p>
        <h2 className="text-base font-semibold text-foreground">Third Parties</h2>
        <p>We use AI providers (OpenAI, Anthropic, OpenRouter, NVIDIA) to process enhancements. Your prompts are sent to the provider you select. Each provider has its own data policy.</p>
        <p className="text-xs mt-8">Last updated: July 2026</p>
      </main>
    </div>
  );
}
