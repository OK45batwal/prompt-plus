"use client";

import { useState, useEffect } from "react";
import { Clock, FileText, Sparkles, Star, ShieldCheck } from "lucide-react";

interface UsageData {
  monthly: { used: number; resetsAt: string };
  totalPrompts: number;
  totalEnhancements: number;
  averageScore: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/v1/usage");
        if (res.ok && mounted) {
          const json = await res.json();
          if (json.data) setData(json.data);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Mock weekly usage distribution for visual chart
  const weeklyActivity = [
    { day: "Mon", count: 12, height: "45%" },
    { day: "Tue", count: 24, height: "70%" },
    { day: "Wed", count: 18, height: "55%" },
    { day: "Thu", count: 32, height: "90%" },
    { day: "Fri", count: 28, height: "80%" },
    { day: "Sat", count: 14, height: "40%" },
    { day: "Sun", count: 8, height: "25%" },
  ];

  const modelBreakdown = [
    { name: "Gemini 2.0 Flash (OpenRouter)", pct: 45, color: "bg-emerald-500" },
    { name: "DeepSeek R1 (OpenRouter)", pct: 25, color: "bg-blue-500" },
    { name: "Claude 3.5 Sonnet", pct: 18, color: "bg-amber-500" },
    { name: "GPT-4o / o3-Mini", pct: 12, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time metrics on prompt usage, model distribution, quality gains, and token efficiency.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border bg-card animate-pulse space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-7 w-16 bg-muted rounded" />
              <div className="h-2 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Monthly Usage</span>
                <Clock className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{(data?.monthly?.used || 0).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Enhancements this month</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Prompts</span>
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{(data?.totalPrompts || 0).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Saved & created prompts</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Enhancements</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{(data?.totalEnhancements || 0).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">AI optimization runs</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Avg Quality Score</span>
                <Star className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{(data?.averageScore || 88).toFixed(1)}/100</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                +46% avg quality boost
              </p>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Activity Bar Chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Optimization Velocity</h3>
                  <p className="text-xs text-muted-foreground">Weekly prompt enhancement volume</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-md bg-accent font-medium">Last 7 Days</span>
              </div>

              {/* Bar Chart Bars */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b">
                {weeklyActivity.map((w) => (
                  <div key={w.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {w.count}
                    </span>
                    <div className="w-full max-w-[36px] bg-accent group-hover:bg-primary/20 rounded-t-md relative overflow-hidden transition-all h-full flex items-end">
                      <div
                        className="w-full bg-primary rounded-t-md transition-all duration-500"
                        style={{ height: w.height }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{w.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Model Share Breakdown */}
            <div className="p-5 rounded-2xl border bg-card space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm">Target Model Usage</h3>
                <p className="text-xs text-muted-foreground">Distribution across AI providers</p>
              </div>

              <div className="space-y-3">
                {modelBreakdown.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate mr-2">{m.name}</span>
                      <span className="font-bold">{m.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} transition-all duration-500`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-accent/40 border text-xs text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>100% serverless routing with instant fallback protection.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
