"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Play, Copy, Check, ExternalLink } from "lucide-react";
import { openAIPlatform } from "@/lib/platform-redirect";

type ProviderId = "openai" | "anthropic" | "openrouter" | "nvidia" | "google";

interface CompareResult {
  provider: ProviderId;
  model: string;
  content?: string;
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
}

const PROVIDERS: { id: ProviderId; label: string; model: string }[] = [
  { id: "openai", label: "OpenAI", model: "GPT-4o Mini" },
  { id: "anthropic", label: "Anthropic", model: "Claude 3.5 Sonnet" },
  { id: "google", label: "Google", model: "Gemini 2.0 Flash" },
  { id: "openrouter", label: "OpenRouter", model: "DeepSeek / Nemotron" },
  { id: "nvidia", label: "NVIDIA", model: "Llama 3.3 70B" },
];

export default function ModelLabPage() {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<ProviderId[]>(["openai", "anthropic"]);
  const [results, setResults] = useState<CompareResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const toggle = (id: ProviderId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 4 ? prev : [...prev, id]));
  };

  const handleRun = async () => {
    if (!text.trim() || selected.length === 0) return;
    setRunning(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/v1/prompts/compare-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, models: selected.map((p) => ({ provider: p })) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Comparison failed");
        setResults(null);
      } else {
        setResults(json.data);
      }
    } catch {
      setError("Network error. No model ran.");
    } finally {
      setRunning(false);
    }
  };

  const copy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const openIn = (content: string) => {
    openAIPlatform("chatgpt", content);
  };

  const totalTokensIn = results ? results.reduce((sum, r) => sum + (r.tokensIn || 0), 0) : 0;
  const allFailed = results !== null && results.length > 0 && results.every((r) => !r.content);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Model Lab</h2>
        <p className="text-xs text-muted-foreground">
          Run one prompt across multiple AI models side-by-side and read each response as the model returned it.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Before you run</p>
        <p>Paste the prompt, then pick at least one model. Pick two or more to compare responses side by side.</p>
        <p>
          Each model runs on its provider&apos;s API key, either yours or a server key. A model without a key returns an
          error for that model only, so you still see the responses that did run.{" "}
          <Link href="/dashboard/settings" className="underline hover:text-foreground">Manage provider keys</Link>
        </p>
      </div>

      <div className="p-3 rounded-lg border bg-card space-y-3">
        <label htmlFor="model-lab-prompt" className="block text-xs font-medium text-muted-foreground">
          Prompt to run
        </label>
        <textarea
          id="model-lab-prompt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the prompt you want to test across models…"
          className="w-full h-32 p-3 rounded-lg border bg-background text-sm resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />

        <div role="group" aria-label="Models to run" className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected.includes(p.id)}
              onClick={() => toggle(p.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                selected.includes(p.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {p.label}
              <span className="ml-1.5 opacity-70 font-normal">{p.model}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{selected.length} model{selected.length !== 1 && "s"} selected</span>
          <button
            type="button"
            onClick={handleRun}
            disabled={!text.trim() || selected.length === 0 || running}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Running…" : "Run comparison"}
          </button>
        </div>
        {!text.trim() && <p className="text-xs text-muted-foreground">Add a prompt to run.</p>}
        {text.trim() && selected.length === 0 && <p className="text-xs text-muted-foreground">Select at least one model to run.</p>}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>

      <div aria-live="polite">
        {running && (
          <div className="rounded-lg border border-border p-6 text-center">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Running {selected.length} model{selected.length === 1 ? "" : "s"}…</p>
            <p className="mt-1 text-xs text-muted-foreground">This waits for each request to finish. Provider charges may apply.</p>
          </div>
        )}

        {!running && !results && !error && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium">No model runs yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Choose your models and run the prompt. Each response appears in its own panel, labelled with the model that produced it.
            </p>
          </div>
        )}

        {!running && results && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {totalTokensIn > 0
                ? `Combined ${totalTokensIn.toLocaleString()} input tokens across the runs that reported usage.`
                : "Token usage was not reported for these runs."}
            </p>
            {allFailed && (
              <p className="text-xs text-muted-foreground">
                No model returned a response. Connect a provider key in{" "}
                <Link href="/dashboard/settings" className="underline hover:text-foreground">Settings</Link>, then run again.
              </p>
            )}
            <div className={`grid gap-3 ${results.length === 1 ? "grid-cols-1" : results.length === 2 ? "grid-cols-1 md:grid-cols-2" : results.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
              {results.map((r, idx) => {
                const content = r.content ?? "";
                return (
                <div key={idx} className="rounded-lg border bg-card overflow-hidden flex flex-col">
                  <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold capitalize block truncate">{r.provider}</span>
                      <span className="text-[11px] text-muted-foreground font-mono block truncate">{r.model}</span>
                    </div>
                    {content && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => copy(content, idx)}
                          aria-label={`Copy ${r.provider} response`}
                          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded"
                        >
                          {copiedIdx === idx ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          {copiedIdx === idx ? "Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openIn(content)}
                          aria-label={`Open ${r.provider} response in ChatGPT`}
                          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded"
                        >
                          <ExternalLink className="h-3 w-3" /> Open in ChatGPT
                        </button>
                      </div>
                    )}
                  </div>
                  {content ? (
                    <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap flex-1 max-h-72 overflow-y-auto">{content}</pre>
                  ) : (
                    <p className="p-3 text-xs text-destructive flex-1">{r.error || "This model returned no content."}</p>
                  )}
                  {content && (
                    <div className="px-3 py-1.5 border-t bg-muted/20 text-[11px] text-muted-foreground font-mono">
                      {typeof r.tokensIn === "number" && typeof r.tokensOut === "number"
                        ? `${r.tokensIn} in · ${r.tokensOut} out`
                        : "Token usage not reported"}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
