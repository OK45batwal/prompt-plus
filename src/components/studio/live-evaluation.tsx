"use client";

import { useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import type { runRealPromptEvaluation } from "@/lib/prompt-engine/evaluation-engine";

type Evaluation = Awaited<ReturnType<typeof runRealPromptEvaluation>>;

export function LiveEvaluation({ originalPrompt, candidateText, promptId, targetModel }: {
  originalPrompt: string; candidateText: string; promptId?: string; targetModel: string;
}) {
  // Only infer literal, explicitly quoted acceptance criteria; never invent an answer.
  const exactHint = originalPrompt.match(/(?:return|output|reply(?: with)?)\s+(?:only|exactly)\s+["“]([^"”]+)["”]/i)?.[1] ?? "";
  const [exact, setExact] = useState(exactHint);
  const [required, setRequired] = useState("");
  const [forbidden, setForbidden] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lines = (text: string) => text.split("\n").map(s => s.trim()).filter(Boolean);
  const hasRubric = !!(exact.trim() || required.trim() || forbidden.trim());

  async function verify() {
    setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch("/api/v2/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ originalPrompt, candidateText, promptId, targetModel,
          confirmLiveEvaluation: true,
          rubric: { exact: exact.trim() || undefined, required: lines(required), forbidden: lines(forbidden) } }),
      });
      const json = await response.json();
      if (!response.ok || !json.data) throw new Error(json.error || "Verification unavailable. Try again.");
      setResult(json.data);
    } catch (err) { setError(err instanceof Error ? err.message : "Verification unavailable."); }
    finally { setLoading(false); }
  }

  const summary = result?.status === "measured"
    ? result.winner === "tie" ? "Both outputs scored equally on your checks."
      : result.winner === "optimized" ? "The enhanced output passed; the original did not."
      : "The original output passed; the enhanced output did not."
    : result?.status === "inconclusive" ? "The runs used different models or providers. No winner can be reported."
    : result?.status === "unevaluated" ? "Responses are available, but no acceptance criteria were applied."
    : "One or both model requests failed. No comparison score is available.";

  return <section className="rounded-xl border bg-card p-5 sm:p-6 space-y-5">
    <div><h2 className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-primary" /> Verify the outputs</h2><p className="mt-2 text-sm text-muted-foreground max-w-2xl">Run the original and enhanced prompts with the same model settings. Define what a correct answer must contain. This checks your criteria, not general quality.</p></div>
    <fieldset disabled={loading} className="grid sm:grid-cols-2 gap-4">
      <label className="text-xs font-medium sm:col-span-2">Exact expected answer <span className="text-muted-foreground font-normal">(optional, for deterministic tasks)</span><textarea value={exact} maxLength={10000} onChange={e => { setExact(e.target.value); setResult(null); }} rows={2} placeholder="For example: 42" className="mt-2 w-full rounded-lg border bg-background p-3 text-sm font-normal" /></label>
      <label className="text-xs font-medium">Required phrases<textarea value={required} onChange={e => { setRequired(e.target.value); setResult(null); }} rows={3} placeholder="One phrase per line" className="mt-2 w-full rounded-lg border bg-background p-3 text-sm font-normal" /></label>
      <label className="text-xs font-medium">Forbidden phrases<textarea value={forbidden} onChange={e => { setForbidden(e.target.value); setResult(null); }} rows={3} placeholder="One phrase per line" className="mt-2 w-full rounded-lg border bg-background p-3 text-sm font-normal" /></label>
    </fieldset>
    <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-muted-foreground max-w-lg">Two live model requests; provider charges may apply. Matching is case-sensitive. Outputs are limited to 800 tokens. Passing all checks scores 100; otherwise 0.</p><button type="button" onClick={verify} disabled={loading || !hasRubric} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Running comparison…" : "Verify with live models"}</button></div>
    {!hasRubric && <p className="text-xs text-muted-foreground">Add at least one acceptance criterion to start.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {result && <div aria-live="polite" className="border-t pt-5 space-y-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">{result.status}</p><p className="text-sm font-medium mt-1">{summary}</p></div>{result.improvementDelta !== null && <p className="text-2xl font-semibold tabular-nums">{result.improvementDelta > 0 ? "+" : ""}{result.improvementDelta} <span className="text-xs font-normal text-muted-foreground">pts</span></p>}</div><div className="grid md:grid-cols-2 gap-4">{[{ label: "Original output", text: result.originalOutput, score: result.baselineScore }, { label: "Enhanced output", text: result.optimizedOutput, score: result.optimizedScore }].map((item, i) => <div key={item.label} className="rounded-lg bg-muted/30 p-4"><h3 className="text-xs font-semibold flex justify-between gap-2">{item.label}<span>{item.score === null ? "Not measured" : `${item.score}/100`}</span></h3><p className="mt-2 text-[11px] text-muted-foreground break-all">{result.runs[i]?.model ?? "Model not recorded"} · {result.runs[i]?.provider ?? "Provider unavailable"}</p><pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed max-h-72 overflow-auto">{item.text || "No response received."}</pre></div>)}</div><p className="text-xs text-muted-foreground">A single run is not a reliability benchmark. Temperature 0 reduces variation but does not guarantee identical results.</p></div>}
  </section>;
}
