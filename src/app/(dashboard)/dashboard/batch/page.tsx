"use client";

import { useState } from "react";
import { Loader2, Sparkles, Copy, Check, ExternalLink } from "lucide-react";
import { openAIPlatform } from "@/lib/platform-redirect";

interface BatchResult {
  input: string;
  output: string;
  error?: string;
}

export default function BatchPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<BatchResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const rawPrompts = input.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const MAX_BATCH_SIZE = 20;
  const prompts = rawPrompts.slice(0, MAX_BATCH_SIZE);

  const handleRun = async () => {
    if (prompts.length === 0) return;
    setRunning(true);
    setResults(null);
    const out: BatchResult[] = [];
    for (let i = 0; i < prompts.length; i++) {
      try {
        const res = await fetch("/api/v1/prompts/enhance-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompts[i], level: "deep" }),
        });
        const json = await res.json();
        if (!res.ok) {
          out.push({ input: prompts[i], output: "", error: json.error || "Failed" });
        } else {
          out.push({ input: prompts[i], output: json.data?.enhanced || "" });
        }
      } catch {
        out.push({ input: prompts[i], output: "", error: "Network error" });
      }
    }
    setResults(out);
    setRunning(false);
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const openIn = (text: string, target: "chatgpt" | "claude" | "gemini") => {
    openAIPlatform(target, text);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Batch Optimizer</h2>
        <p className="text-xs text-muted-foreground">
          Paste many prompts — one per line — and enhance them all in one pass.
        </p>
      </div>

      <div className="p-3 rounded-lg border bg-card space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"Rewrite this landing page copy\nDebug my React useEffect loop\nWrite 5 LinkedIn post hooks for a SaaS"}
          className="w-full h-40 p-3 rounded-lg border bg-background text-sm resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring placeholder:text-muted-foreground font-mono"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{prompts.length} prompt{prompts.length !== 1 && "s"}</span>
          <button
            onClick={handleRun}
            disabled={prompts.length === 0 || running}
            className="h-9 px-4 rounded-lg bg-foreground text-background text-xs font-semibold flex items-center gap-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {running ? "Enhancing…" : "Enhance All"}
          </button>
        </div>
      </div>

      {results && (
        <div className="space-y-3">
          {results.map((r, idx) => (
            <div key={idx} className="rounded-lg border bg-card overflow-hidden">
              <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {idx + 1}. {r.input}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => copy(r.output, idx)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    {copiedIdx === idx ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copiedIdx === idx ? "Copied" : "Copy"}
                  </button>
                  <div className="hidden sm:flex items-center gap-2">
                    {(["chatgpt", "claude", "gemini"] as const).map((t) => (
                      <button key={t} onClick={() => openIn(r.output, t)} className="text-[11px] text-muted-foreground hover:text-foreground capitalize flex items-center gap-0.5">
                        <ExternalLink className="h-3 w-3" /> {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {r.error ? <span className="text-red-600">{r.error}</span> : r.output}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
