import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, Folder } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getDb } from "@/lib/db/prisma";

export default async function SharedPromptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const prompt = await getDb().prompt.findUnique({
    where: { sharedToken: token },
    include: {
      user: { select: { name: true } },
      collection: { select: { name: true } },
    },
  });

  if (!prompt) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b">
        <Link href="/">
          <Logo size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="px-2 py-0.5 rounded bg-muted font-medium">{prompt.model}</span>
              {prompt.category && <span className="px-2 py-0.5 rounded bg-muted">{prompt.category}</span>}
              {prompt.collection && (
                <span className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  {prompt.collection.name}
                </span>
              )}
              <span>• Shared by {prompt.user?.name || "a user"}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {prompt.title || "Shared AI Prompt"}
            </h1>
          </div>

          {/* Original Text */}
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Original Prompt
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{prompt.originalText}</p>
          </div>

          {/* Enhanced Text if available */}
          {prompt.enhancedText && (
            <div className="p-4 rounded-lg border border-primary/30 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase text-foreground tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  Enhanced Version
                </h2>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
                {prompt.enhancedText}
              </p>
            </div>
          )}

          {/* CTA Banner */}
          <div className="p-6 rounded-xl border bg-muted/30 text-center space-y-3 mt-8">
            <h3 className="font-semibold text-base">Want to optimize your own prompts?</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Use AI Prompt+ to score, refine, and enhance prompts for GPT-4, Claude, and Gemini in seconds.
            </p>
            <Link
              href="/signup"
              className="h-9 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Start for Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
