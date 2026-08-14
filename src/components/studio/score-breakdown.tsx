"use client";

import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

interface DimensionBreakdown {
  clarity?: number;
  specificity?: number;
  structure?: number;
  context?: number;
  actionability?: number;
  efficiency?: number;
}

interface ScoreBreakdownProps {
  originalScore: number;
  enhancedScore: number;
  dimensions?: DimensionBreakdown;
  v2HybridScore?: {
    structuralScore: number;
    intentScore: number;
    constraintScore: number;
    evaluationScore: number;
    efficiencyScore: number;
  };
}

export function ScoreBreakdown({
  originalScore,
  enhancedScore,
  dimensions,
  v2HybridScore,
}: ScoreBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const dims = [
    { label: "Clarity", val: dimensions?.clarity ?? 88 },
    { label: "Specificity", val: dimensions?.specificity ?? 85 },
    { label: "Structure", val: dimensions?.structure ?? 92 },
    { label: "Context", val: dimensions?.context ?? 80 },
    { label: "Actionability", val: dimensions?.actionability ?? 90 },
  ];

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      {/* Overall Score Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          Prompt Quality Score
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Original: {originalScore}</span>
          <span className="text-xs font-bold text-green-600 dark:text-green-400">
            → Enhanced: {enhancedScore}/100
          </span>
        </div>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${enhancedScore}%` }}
        />
      </div>

      {/* Expand / Collapse Details Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1 pt-1"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide Detailed Metrics" : "View Score Dimension Breakdown"}
      </button>

      {/* Expanded Dimensional Breakdown */}
      {expanded && (
        <div className="pt-2 border-t space-y-2.5">
          {/* Hybrid V2 Score Pills if available */}
          {v2HybridScore && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 rounded bg-muted/40 border text-center">
                <p className="text-muted-foreground">Structural</p>
                <p className="font-bold text-foreground">{v2HybridScore.structuralScore}/20</p>
              </div>
              <div className="p-2 rounded bg-muted/40 border text-center">
                <p className="text-muted-foreground">Intent Preserved</p>
                <p className="font-bold text-foreground">{v2HybridScore.intentScore}/20</p>
              </div>
              <div className="p-2 rounded bg-muted/40 border text-center">
                <p className="text-muted-foreground">Constraints</p>
                <p className="font-bold text-foreground">{v2HybridScore.constraintScore}/20</p>
              </div>
              <div className="p-2 rounded bg-muted/40 border text-center">
                <p className="text-muted-foreground">Efficiency</p>
                <p className="font-bold text-foreground">{v2HybridScore.efficiencyScore}/15</p>
              </div>
            </div>
          )}

          {/* Individual Dimension Progress Bars */}
          <div className="space-y-1.5 pt-1">
            {dims.map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-semibold text-foreground">{d.val}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      d.val >= 80 ? "bg-emerald-500" : d.val >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${d.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
