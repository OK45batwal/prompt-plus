"use client";

import { useState, useEffect } from "react";
import { BarChart3, Clock, FileText, Sparkles, Star } from "lucide-react";

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
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-xs text-muted-foreground">
          Real-time metrics on prompt usage, LLM response latency, and token consumption.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="h-7 w-16 bg-muted rounded mb-2" />
              <div className="h-2 w-full bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : !data || data.totalEnhancements === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No analytics data yet. Start enhancing prompts to see metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Monthly Usage</p>
            </div>
            <p className="text-lg font-semibold">{data.monthly.used.toLocaleString()} enhancements</p>
            <p className="text-xs text-muted-foreground mt-1">This calendar month</p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Total Prompts</p>
            </div>
            <p className="text-lg font-semibold">{data.totalPrompts.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Total Enhancements</p>
            </div>
            <p className="text-lg font-semibold">{data.totalEnhancements.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Average Score</p>
            </div>
            <p className="text-lg font-semibold">{data.averageScore.toFixed(1)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
