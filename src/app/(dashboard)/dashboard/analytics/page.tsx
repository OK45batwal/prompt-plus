"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, ArrowUpRight, Activity } from "lucide-react";

type AnalyticsData = {
  kpis: {
    totalPrompts: number; totalEnhancements: number; averageScore: number | null;
    scoresMeasured: number; scoreLift: number | null; pairedScores: number;
    avgLatencyMs: number | null; totalTokens: number;
  };
  dailyActivity: { date: string; day: string; total: number; prompts: number; enhancements: number; height: string }[];
  modelBreakdown: { name: string; count: number; pct: number }[];
  categoryBreakdown: { name: string; count: number; pct: number }[];
  recentLogs: { id: string; action: string; model: string | null; provider: string | null; latencyMs: number | null; success: boolean; createdAt: string }[];
};

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/analytics/stats?range=${range}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Analytics could not be loaded. Try again.");
        const json = await response.json();
        if (!json.data) throw new Error("Analytics returned an incomplete response.");
        setData(json.data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Analytics unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [range, refresh]);

  const exportData = useCallback(() => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `prompt-plus-analytics-${range}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data, range]);

  const k = data?.kpis;
  const metrics = [
    { label: "Saved prompts", value: k?.totalPrompts ?? "—", detail: "All time, excluding deleted prompts" },
    { label: "Model assessment", value: k?.averageScore == null ? "—" : `${k.averageScore}/100`, detail: k?.scoresMeasured ? `${k.scoresMeasured} assessed prompts in this period` : "No scored prompts yet" },
    { label: "Assessment change", value: k?.scoreLift == null ? "—" : `${k.scoreLift > 0 ? "+" : ""}${k.scoreLift} pts`, detail: k?.pairedScores ? `${k.pairedScores} saved before-and-after pairs` : "No paired assessments yet" },
    { label: "Average latency", value: k?.avgLatencyMs == null ? "—" : `${k.avgLatencyMs.toLocaleString()} ms`, detail: "Recorded requests in this period" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b pb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-2">YOUR WORKSPACE / ACTIVITY</p>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">A record of your prompts and model requests. Missing measurements stay empty.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="analytics-range">Reporting period</label>
          <select id="analytics-range" value={range} onChange={e => setRange(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">Last 90 days</option>
          </select>
          <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={loading} aria-label="Refresh analytics" className="rounded-lg border p-2.5 hover:bg-muted disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button type="button" onClick={exportData} disabled={!data || loading || !!error} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"><Download className="h-4 w-4" /> Export</button>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-destructive/30 p-5"><p>{error}</p><button className="mt-3 underline text-sm" onClick={() => setRefresh(n => n + 1)}>Retry</button></div>
        : loading ? <div role="status" aria-label="Loading analytics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}</div>
        : data && <>
          <section aria-label="Workspace metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
            {metrics.map(metric => <div key={metric.label} className="border-b pb-5">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
            </div>)}
          </section>
          <section className="rounded-xl border p-5 sm:p-6">
            <div className="flex flex-wrap justify-between gap-3 mb-6"><div><h2 className="font-semibold">Activity over time</h2><p className="mt-1 text-xs text-muted-foreground">Saved prompts and enhancement requests</p></div><Link href="/dashboard/new" className="text-sm inline-flex items-center gap-1 text-primary">Open Studio <ArrowUpRight className="h-4 w-4" /></Link></div>
            {data.dailyActivity.some(day => day.total > 0) ? <div className="overflow-x-auto"><div className="flex h-44 items-end gap-2 min-w-full" style={{ minWidth: data.dailyActivity.length > 30 ? "900px" : undefined }}>
              {data.dailyActivity.map(day => <div key={day.date} className="flex flex-1 h-full flex-col justify-end items-center gap-2 min-w-2" title={`${day.date}: ${day.prompts} saved, ${day.enhancements} enhancements`}><div className="w-full bg-primary/75 rounded-t-sm" style={{ height: day.height }} /><span className="text-[10px] text-muted-foreground">{data.dailyActivity.length <= 7 ? day.day : day.date.slice(8)}</span></div>)}
            </div></div> : <div className="py-12 text-center"><Activity className="h-6 w-6 mx-auto mb-3 text-muted-foreground" /><p className="text-sm font-medium">Your first prompt starts the story</p><p className="text-xs text-muted-foreground mt-2">Save or enhance a prompt to see activity here.</p></div>}
          </section>
          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-xl border p-6"><h2 className="font-semibold">Models used</h2><p className="text-xs text-muted-foreground mt-1 mb-5">Requests with a recorded model</p>{data.modelBreakdown.length ? data.modelBreakdown.map(model => <div key={model.name} className="mb-4"><div className="flex justify-between gap-3 text-xs mb-2"><span className="break-all">{model.name}</span><span className="tabular-nums shrink-0">{model.count} · {model.pct}%</span></div><div className="h-1.5 rounded bg-muted"><div className="h-full bg-primary/70 rounded" style={{ width: `${model.pct}%` }} /></div></div>) : <p className="text-sm text-muted-foreground py-6">No model requests recorded yet.</p>}</section>
            <section className="rounded-xl border p-6"><h2 className="font-semibold">Prompt categories</h2><p className="text-xs text-muted-foreground mt-1 mb-5">Saved prompts in this period</p>{data.categoryBreakdown.length ? data.categoryBreakdown.map(category => <div key={category.name} className="flex justify-between gap-4 border-b py-3 text-sm"><span className="capitalize">{category.name}</span><span className="tabular-nums text-muted-foreground">{category.count} · {category.pct}%</span></div>) : <p className="text-sm text-muted-foreground py-6">Categories appear when you save prompts.</p>}</section>
          </div>
          <section className="rounded-xl border overflow-hidden"><div className="p-6 border-b"><h2 className="font-semibold">Recent requests</h2><p className="text-xs text-muted-foreground mt-1">Latest stored events. Refresh to check for updates.</p></div>{data.recentLogs.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-muted-foreground bg-muted/30"><tr>{["Action", "Model", "Status", "Latency", "Time"].map(label => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{data.recentLogs.map(log => <tr key={log.id} className="border-t"><td className="px-5 py-4 capitalize">{log.action}</td><td className="px-5 py-4 text-xs">{log.model ?? "Not recorded"}<span className="block text-muted-foreground mt-1">{log.provider ?? "Provider not recorded"}</span></td><td className="px-5 py-4">{log.success ? "Completed" : "Failed"}</td><td className="px-5 py-4 tabular-nums whitespace-nowrap">{log.latencyMs == null ? "—" : `${log.latencyMs} ms`}</td><td className="px-5 py-4 text-xs whitespace-nowrap text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground text-center py-12">No requests recorded in this period.</p>}</section>
          <p className="text-xs text-muted-foreground max-w-3xl">Model assessments reflect a model’s judgment of prompt wording. They are not output benchmarks. Use live verification in the Studio to compare responses against your own acceptance criteria.</p>
        </>}
    </div>
  );
}
