import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Documentation</h1>
        <p className="text-muted-foreground mb-10 text-sm">
          Complete guide to using Prompt+, Chrome Extension, On-Device AI, Context Bucket, and API v1 endpoints.
        </p>

        <section className="space-y-8 text-sm">
          <div>
            <h2 className="text-xl font-bold mb-2">1. On-Device AI (Chrome Gemini Nano)</h2>
            <p className="text-muted-foreground leading-relaxed">
              On-Device mode runs 100% locally inside Chrome 138+ using Chrome&apos;s built-in <code>window.ai.languageModel</code> Prompt API. Prompts are enhanced in sub-100ms with zero network requests and zero server data transmission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">2. Cross-Chatbot Context Bucket Handoff</h2>
            <p className="text-muted-foreground leading-relaxed">
              When your token limit or message cap is reached on ChatGPT, click <strong><code>📦 Carry Context</code></strong> in the Chrome Extension toolbar. Prompt+ scrapes the active conversation turns and saves them to local storage. Switch to Claude, Gemini, or DeepSeek and click <strong><code>💉 Inject Context</code></strong> to continue seamlessly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">3. Chrome Extension Setup</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Prompt+ extension injects an unobtrusive floating toolbar above prompt boxes on ChatGPT, Claude, Gemini, DeepSeek, Grok, and Perplexity. Use <code>Cmd+Shift+P</code> (or <code>Ctrl+Shift+P</code>) to trigger popover enhancements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">4. API v1 Integration</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Developers can access the Prompt+ Architect Engine programmatically via REST API:
            </p>
            <pre className="p-4 rounded-xl bg-muted font-mono text-xs overflow-x-auto border">
{`POST /api/v1/extension/enhance
Content-Type: application/json

{
  "text": "Write a python script for scraping weather data",
  "category": "Coding",
  "tone": "Technical"
}`}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              OpenAPI 3.0 specification available at <Link href="/api/v1/docs" className="text-primary hover:underline">/api/v1/docs</Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
