import Link from "next/link";

const troubleshooting = [
  {
    problem: "The Enhance control does not appear in a chat.",
    fix: "The extension runs on ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Meta AI. Reload the page after installing or updating it, and make sure the extension is enabled.",
  },
  {
    problem: "The token readout says it cannot be measured.",
    fix: "Prompt+ counts only the messages currently visible on the page; it does not guess a chat's hidden context limit. Open the conversation so its messages load, then reopen the panel.",
  },
  {
    problem: "Chrome AI is not available.",
    fix: "Chrome AI uses your browser's built-in model and only appears when Chrome provides it. Use Instant, which runs on your device without a network call, or Cloud key with a key saved in Settings.",
  },
  {
    problem: "Cloud key asks you to sign in.",
    fix: "Cloud key uses an account and an API key you save in Settings. Sign in, add a key, then enhance again. Instant and Chrome AI still work without either.",
  },
  {
    problem: "Apply leaves my text unchanged.",
    fix: "If the chat input changed while the enhancement was running, Prompt+ leaves your text alone and asks you to run Enhance again on the latest text. Run it again to review the current version.",
  },
];

export default function DocsPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Documentation</h1>
        <p className="text-muted-foreground mb-10 text-sm leading-relaxed">
          How to turn a rough request into a clearer prompt with Prompt+, keep reusable context, and
          install the browser extension.
        </p>

        <div className="space-y-12 text-sm">
          <section aria-labelledby="first-enhancement">
            <h2 id="first-enhancement" className="text-xl font-bold mb-3">
              1. Your first enhancement
            </h2>
            <ol className="space-y-3 text-muted-foreground leading-relaxed list-decimal pl-5">
              <li>
                Open the{" "}
                <Link href="/dashboard/new" className="text-primary hover:underline">
                  web editor
                </Link>
                , or open the extension popup from the browser toolbar.
              </li>
              <li>
                Type a rough request, for example &quot;add rate limiting to the auth middleware&quot;.
                In the popup you can also use Paste, Voice, or Clear above the text box.
              </li>
              <li>
                Pick a tone: Natural, Technical, Executive, Marketing, or Reasoning. Tone changes the
                wording, not the task.
              </li>
              <li>
                Choose an engine. Instant runs on your device with no network call. Cloud key uses an
                API key you saved in Settings. Chrome AI uses your browser&apos;s built-in model when it
                is available.
              </li>
              <li>
                Press <strong>Enhance prompt</strong> (or <kbd>⌘↵</kbd> on Mac, <kbd>Ctrl+↵</kbd> on
                Windows). In the extension the result appears as a review panel before anything is
                inserted.
              </li>
              <li>
                Review before you use it. The extension panel has <strong>What changed</strong> and{" "}
                <strong>Final prompt</strong> views, with the measured token change between your
                original and the result. Choose <strong>Apply</strong> to replace the text in the chat,
                or <strong>Copy</strong> to keep the original and take the result elsewhere. After
                applying you can <strong>Undo</strong>.
              </li>
            </ol>
          </section>

          <section aria-labelledby="reusable-context">
            <h2 id="reusable-context" className="text-xl font-bold mb-3">
              2. Reusable context
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A context block is a short note you keep, such as a writing style or the stack you work
              with. Open the <strong>Context</strong> tab in the popup and turn on the rules that apply.
              Every rule you turn on is added to each prompt you enhance. The Enhance tab shows{" "}
              <strong>Context: N rules</strong>, so you can see what is active before you run it.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To take a finished prompt to a different tool, open <strong>More options</strong> in the
              popup and use <strong>Open in another AI</strong>. Each listed platform opens with the
              prompt ready, or use <strong>Open in all</strong> to open every listed platform.
            </p>
          </section>

          <section aria-labelledby="installing-extension">
            <h2 id="installing-extension" className="text-xl font-bold mb-3">
              3. Installing the extension
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              There are two ways to install it.
            </p>
            <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>
                <strong>From the Chrome Web Store.</strong> Open the{" "}
                <Link href="/extension" className="text-primary hover:underline">
                  extension page
                </Link>{" "}
                and choose Add to Chrome.
              </li>
              <li>
                <strong>From the release build.</strong> Download the ZIP, unzip it, open{" "}
                <code>chrome://extensions</code>, turn on <strong>Developer mode</strong>, choose{" "}
                <strong>Load unpacked</strong>, and select the unzipped folder.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Once it is installed, open a supported chat. A small dock appears next to the prompt box
              with an <strong>Enhance</strong> button, three quick tone switches, a token readout for
              the visible messages, and a <strong>More</strong> button that opens the full panel. You
              can also press <kbd>⌘⇧P</kbd> (or <kbd>Ctrl+Shift+P</kbd> on Windows) to open the panel.
            </p>
          </section>

          <section aria-labelledby="troubleshooting">
            <h2 id="troubleshooting" className="text-xl font-bold mb-3">
              4. Troubleshooting
            </h2>
            <dl className="divide-y divide-border/60 border-y border-border/60">
              {troubleshooting.map((item) => (
                <div key={item.problem} className="py-4">
                  <dt className="font-semibold text-foreground">{item.problem}</dt>
                  <dd className="mt-1 text-muted-foreground leading-relaxed">{item.fix}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted-foreground leading-relaxed mt-6">
              Building on the API? The REST endpoint and OpenAPI 3.0 reference are at{" "}
              <Link href="/api/v1/docs" className="text-primary hover:underline">
                /api/v1/docs
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
