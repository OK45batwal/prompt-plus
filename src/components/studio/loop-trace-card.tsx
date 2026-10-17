"use client";

import { RefreshCw, Zap, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { LoopTrace } from "@/lib/prompt-engine/loop-engine";

interface LoopTraceCardProps {
  loopTrace?: LoopTrace;
}

export function LoopTraceCard({ loopTrace }: LoopTraceCardProps) {
  if (!loopTrace) return null;

  return (
    <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-md shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <span>Loop Engineering Engine</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Converged
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Self-refining closed-loop optimization in <strong className="text-foreground">{loopTrace.latencyMs}ms</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-500">
              +{loopTrace.scoreDelta} pts
            </span>
            <span className="block text-[9px] text-muted-foreground uppercase tracking-wider">
              Quality Gain
            </span>
          </div>
        </div>
      </div>

      {/* Cycle Progression Track */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
        <div className="p-2 rounded-lg bg-background/80 border text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium block">Cycles Run</span>
          <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> {loopTrace.cyclesRun} Iterations
          </span>
        </div>

        <div className="p-2 rounded-lg bg-background/80 border text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium block">Initial Score</span>
          <span className="text-sm font-bold text-muted-foreground">{loopTrace.initialScore}/100</span>
        </div>

        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Final Converged</span>
          <span className="text-sm font-bold text-emerald-500">{loopTrace.finalScore}/100</span>
        </div>
      </div>

      {/* Applied Improvements Pills */}
      {loopTrace.improvementsApplied && loopTrace.improvementsApplied.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-400" /> Automated Optimizations Applied:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {loopTrace.improvementsApplied.map((imp, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border font-medium flex items-center gap-1"
              >
                <ShieldCheck className="h-2.5 w-2.5 text-indigo-400" /> {imp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
