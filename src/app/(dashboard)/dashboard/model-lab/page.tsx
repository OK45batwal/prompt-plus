"use client";

import { useState } from "react";
import { Loader2, Play, Copy, Check, ExternalLink } from "lucide-react";
import { openAIPlatform } from "@/lib/platform-redirect";

type ProviderId = "openai" | "anthropic" | "openrouter" | "nvidia";

interface CompareResult {
  provider: ProviderId;
  model: string;
  content?: string;
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
}

const PROVIDERS: { id: ProviderId; label: string; model: string }[] = [
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini" },
  { id: "anthropic", label: "Anthropic", model: "Claude 3.5 Sonnet" },
  { id: "openrouter", label: "OpenRouter", model: "Llama 3.3 (free)" },
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
      setError("Network error");
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

  const totalTokensIn = results && results.length > 0 ? results.reduce((sum, r) => sum + (r.tokensIn || 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Model Lab</h2>
        <p className="text-xs text-muted-foreground">
          Run one prompt across multiple AI models side-by-side and compare the responses.
        </p>
      </div>

      <div className="p-3 rounded-lg border bg-card space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the prompt you want to test across models…"
          className="w-full h-32 p-3 rounded-lg border bg-background text-sm resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
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
            onClick={handleRun}
            disabled={!text.trim() || selected.length === 0 || running}
            className="h-9 px-4 rounded-lg bg-foreground text-background text-xs font-semibold flex items-center gap-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Running…" : "Run Comparison"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {results && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Combined: {totalTokensIn.toLocaleString()} input tokens — each response opens fresh with the model&apos;s own formatting.
          </p>
          <div className={`grid gap-3 ${results.length === 1 ? "grid-cols-1" : results.length === 2 ? "grid-cols-1 md:grid-cols-2" : results.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
            {results.map((r, idx) => {
              const content = r.content ?? "";
              return (
              <div key={idx} className="rounded-lg border bg-card overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold capitalize block truncate">{r.provider}</span>
                    <span className="text-[10px] text-muted-foreground font-mono block truncate">{r.model}</span>
                  </div>
                  {content && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => copy(content, idx)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                        {copiedIdx === idx ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                        {copiedIdx === idx ? "Copied" : "Copy"}
                      </button>
                      <button onClick={() => openIn(content)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                        <ExternalLink className="h-3 w-3" /> Open
                      </button>
                    </div>
                  )}
                </div>
                {content ? (
                  <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap flex-1 max-h-72 overflow-y-auto">{content}</pre>
                ) : (
                  <p className="p-3 text-xs text-red-600 flex-1">{r.error}</p>
                )}
                {content && (
                  <div className="px-3 py-1.5 border-t bg-muted/20 text-[10px] text-muted-foreground font-mono">
                    {r.tokensIn} in · {r.tokensOut} out
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
