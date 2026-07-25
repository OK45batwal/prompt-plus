"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Zap, Clock, Activity, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [usageStats, setUsageStats] = useState({
    totalRequests: 24,
    successRate: "98.2%",
    avgLatency: "420ms",
    tokensProcessed: "18.4k",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-xs text-muted-foreground">
          Real-time metrics on prompt usage, LLM response latency, and token consumption.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Requests</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold">{usageStats.totalRequests}</div>
          <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +12% from yesterday
          </p>
        </Card>

        <Card className="p-4 border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-extrabold">{usageStats.successRate}</div>
          <p className="text-[10px] text-muted-foreground">0 API failures logged</p>
        </Card>

        <Card className="p-4 border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Avg Response Latency</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold">{usageStats.avgLatency}</div>
          <p className="text-[10px] text-muted-foreground">Optimal performance</p>
        </Card>

        <Card className="p-4 border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Tokens Processed</span>
            <Zap className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold">{usageStats.tokensProcessed}</div>
          <p className="text-[10px] text-muted-foreground">Input & Output Tokens</p>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" /> Model Distribution
            </h3>
            <span className="text-xs text-muted-foreground">Last 7 Days</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span>GPT-4o Mini (OpenAI)</span>
                <span>65%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span>Claude 3.5 Sonnet (Anthropic)</span>
                <span>25%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span>Local Optimizer</span>
                <span>10%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" /> Usage & Rate Limits
            </h3>
            <span className="text-xs text-muted-foreground">Daily Allowance</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-accent/40 border space-y-1">
              <div className="flex justify-between font-medium">
                <span>Free Tier Quota</span>
                <span>5 / 20 used</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Resets daily at 00:00 UTC. Configure your custom API key in Settings for unlimited requests.
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="font-medium text-xs">Connected API Keys</span>
              <p className="text-[11px] text-muted-foreground">
                BYOK (Bring Your Own Key) mode bypasses daily limits and routes directly to your AI provider account.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
