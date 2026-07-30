import Link from "next/link";
import { ExternalLink, Puzzle, Zap, Sparkles, Copy, Layers } from "lucide-react";

const steps = [
  { icon: Puzzle, title: "Install", desc: "Add the Prompt+ extension from the Chrome Web Store (or load unpacked in dev mode)." },
  { icon: Sparkles, title: "Open a Chat", desc: "Visit ChatGPT, Claude, Gemini, or DeepSeek. A floating Prompt+ button appears near the input." },
  { icon: Copy, title: "Enhance", desc: "Click the button to open the side panel, refine your prompt, and apply it — no copy-paste needed." },
  { icon: Layers, title: "Configure", desc: "Set your API key, pick a model, and toggle Token Saver mode from the popup or panel." },
];

export default function ExtensionPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary mb-6">
            <Zap className="h-3.5 w-3.5" />
            Browser Extension
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Enhance Prompts Directly in Your Chat
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Use Prompt+ inside ChatGPT, Claude, Gemini, and DeepSeek — without leaving the page.
            Refine, preview, and apply prompts with one click.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {steps.map((s) => (
            <div key={s.title} className="p-5 rounded-xl border bg-card">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="text-sm font-bold mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Install instructions */}
        <div className="p-6 rounded-xl border bg-card mb-14">
          <h2 className="text-base font-bold mb-3">Manual Install (Developer Mode)</h2>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open <code className="text-primary text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">chrome://extensions</code></li>
            <li>Enable <strong>Developer mode</strong> (toggle in top-right)</li>
            <li>Click <strong>Load unpacked</strong></li>
            <li>Select the <code className="text-primary text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">extension/</code> folder from the repo</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-4">
            Chrome Web Store listing coming soon. For now, use the manual install above.
          </p>
        </div>

        {/* Features */}
        <div className="mb-14">
          <h2 className="text-base font-bold mb-4">What You Get</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            {[
              "Floating action button on ChatGPT, Claude, Gemini, and DeepSeek",
              "Side panel with structured prompt analysis and sections",
              "Original vs enhanced side-by-side preview",
              "One-click apply — no manual copy-paste",
              "Token usage bar showing estimated context window",
              "Token Saver mode for ~40% fewer tokens",
              "7 free OpenRouter models + NVIDIA models",
              "Device AI mode using Chrome's built-in Gemini Nano",
              "Server mode with your API key",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl border bg-gradient-to-r from-primary/10 via-card to-primary/5">
          <p className="text-sm text-muted-foreground mb-4">
            Get started — the web app works in any browser with no install needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="h-10 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-5 text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              Try Prompt+ Online
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
