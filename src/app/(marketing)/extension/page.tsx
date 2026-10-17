import Link from "next/link";
import { ExternalLink, Puzzle, CheckCircle2 } from "lucide-react";

const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/gdfaohfmmjjmpiggdcankjjihpljoccn";

const capabilities = [
  "An Enhance control in the prompt box on ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Meta AI",
  "Review before you insert: What changed and Final prompt, with the measured token change",
  "Three quick tone switches in the dock, and five tones in the popup",
  "Reusable context rules added to every prompt you enhance",
  "An approximate token count for the messages visible in the open chat",
  "Prompt templates and your last 20 enhancements",
  "Instant, Cloud key, and Chrome AI engines",
  "Open the result in another AI from the popup",
];

export default function ExtensionPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Enhance a prompt inside the chat you already use.
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-6">
            The extension adds an Enhance control to the prompt box. Write your request, enhance it in
            place, review the change, then apply it or copy it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 text-sm font-semibold hover:bg-primary/90 transition-all gap-2.5 group active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Puzzle className="h-4 w-4" />
              Add to Chrome
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <Link
              href="/docs"
              className="h-12 inline-flex items-center justify-center rounded-xl border bg-card px-5 text-sm font-semibold hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Read the setup steps
            </Link>
          </div>
        </div>

        {/* How it works */}
        <section aria-labelledby="how-it-works" className="mb-14">
          <h2 id="how-it-works" className="text-base font-bold mb-4">
            How it works
          </h2>
          <ol className="space-y-4 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
            <li>
              Install the extension from the Chrome Web Store, or load the release build. It is a
              Manifest V3 extension for Chrome and Edge.
            </li>
            <li>Open a supported chat and write a rough request in the prompt box.</li>
            <li>
              Press <strong>Enhance</strong> in the dock. The review panel opens with{" "}
              <strong>What changed</strong> and <strong>Final prompt</strong>, so you can check the
              result before anything is inserted.
            </li>
            <li>
              Choose <strong>Apply</strong> to replace the text, or <strong>Copy</strong> to keep the
              original. Open <strong>More options</strong> for the engine, tone, context rules, and{" "}
              <strong>Open in another AI</strong>.
            </li>
          </ol>
        </section>

        {/* Capabilities */}
        <section aria-labelledby="what-it-does" className="mb-14">
          <h2 id="what-it-does" className="text-base font-bold mb-4">
            What the extension does
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {capabilities.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Privacy */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-14">
          Prompt+ does not ask for your ChatGPT, Claude, or Gemini password. If you connect your own
          API key, it is stored encrypted on your device. Platform names are compatibility information
          only; Prompt+ is not affiliated with or endorsed by them.
        </p>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl border bg-card space-y-4">
          <h2 className="text-lg font-bold">Add it to your browser</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 text-sm font-semibold hover:bg-primary/90 transition-all gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Install from Chrome Web Store
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/dashboard/new"
              className="h-11 inline-flex items-center justify-center rounded-xl border bg-card px-5 text-sm font-semibold hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open the web editor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
