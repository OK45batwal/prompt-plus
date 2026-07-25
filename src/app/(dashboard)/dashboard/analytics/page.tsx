"use client";

import { BarChart3, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-xs text-muted-foreground">
          Real-time metrics on prompt usage, LLM response latency, and token consumption.
        </p>
      </div>

      <div className="text-center py-12">
        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No analytics data yet. Start enhancing prompts to see metrics.</p>
      </div>
    </div>
  );
}
