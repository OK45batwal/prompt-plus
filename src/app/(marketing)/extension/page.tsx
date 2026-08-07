import Link from "next/link";
import { ExternalLink, Puzzle, Zap, Sparkles, Copy, Layers } from "lucide-react";

const steps = [
  { icon: Puzzle, title: "Install", desc: "Chrome Web Store review in progress — for now, load the unpacked extension from the extension/ folder via Developer Mode." },
  { icon: Sparkles, title: "Open a Chat", desc: "Visit ChatGPT, Claude, Gemini, or DeepSeek. A floating Prompt+ button appears near the input." },
  { icon: Copy, title: "Enhance", desc: "Click the button — a compact preview pops up right at your input. Review, then use it with one click." },
  { icon: Layers, title: "Configure", desc: "Pick On-Device or API mode. API mode works instantly with a free server model — add your own key for full model access." },
];

export default function ExtensionPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary mb-6">
            <Zap className="h-3.5 w-3.5" />
            Browser Extension v1.1.0 • 🟢 100% Secure & AES Encrypted
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Enhance Prompts Directly in Your Chat
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-6">
            Use Prompt+ inside ChatGPT, Claude, Gemini, and DeepSeek — without leaving the page.
            One click on the floating button enhances your prompt, right at the input.
          </p>
          <div className="flex justify-center">
            <a
              href="/api/v1/extension/download"
              download="prompt-plus-extension-v1.1.0.zip"
              className="h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 text-sm font-semibold hover:bg-primary/90 transition-all shadow-md gap-2"
            >
              <Puzzle className="h-4 w-4" />
              Download Extension Package v1.1.0 (.zip)
            </a>
          </div>
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
          <p className="text-xs text-muted-foreground mb-4">
            The extension is currently in Chrome Web Store review. Until it&apos;s listed, install it manually:
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open <code className="text-primary text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">chrome://extensions</code></li>
            <li>Enable <strong>Developer mode</strong> (toggle in top-right)</li>
            <li>Click <strong>Load unpacked</strong></li>
            <li>Select the <code className="text-primary text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">extension/</code> folder from the repo</li>
          </ol>
        </div>

        {/* Features */}
        <div className="mb-14">
          <h2 className="text-base font-bold mb-4">What You Get</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            {[
              "Floating action button on ChatGPT, Claude, Gemini, and DeepSeek",
              "Compact preview popover right at the chat input",
              "Enhanced result with token-remaining bar",
              "One-click apply or keep original — no manual copy-paste",
              "Full side panel for advanced, structured prompt analysis",
              "Token Saver mode for ~40% fewer tokens",
              "On-Device mode using Chrome's built-in Gemini Nano — free, private, offline",
              "API mode with a free server model out of the box, or your own key for full model access",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* On-Device Requirements */}
        <div className="p-6 rounded-xl border bg-amber-500/5 border-amber-500/20 mb-14">
          <h2 className="text-base font-bold mb-2">On-Device AI Requirements</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            On-Device mode uses Chrome&apos;s built-in Gemini Nano and needs <strong>Chrome 138 or later</strong> on
            macOS 13+ / Windows 10+ / Linux, with ~22GB free storage, and the Prompt API enabled
            (<code className="text-primary text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">chrome://flags/#prompt-api-for-gemini-nano</code>).
            Not supported? API mode works everywhere — a free server model is included, no key needed.
          </p>
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
