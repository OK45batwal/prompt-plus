"use client";

import React, { useState } from "react";
import { PromptCandidate } from "@/lib/prompt-engine/types";
import { PromptDiff } from "@/components/dashboard/prompt-diff";

interface CandidateComparerProps {
  originalPrompt: string;
  candidates: (PromptCandidate & {
    hybridScore?: {
      totalScore: number;
      structuralScore: number;
      intentScore: number;
      constraintScore: number;
      evaluationScore: number;
      efficiencyScore: number;
    };
  })[];
  onSelectCandidate?: (candidate: PromptCandidate) => void;
}

export function CandidateComparer({ originalPrompt, candidates, onSelectCandidate }: CandidateComparerProps) {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || "");
  const activeCandidate = candidates.find((c) => c.id === selectedId) || candidates[0];

  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Candidate Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {candidates.map((cand) => {
          const isActive = cand.id === activeCandidate?.id;
          const score = cand.hybridScore?.totalScore || cand.score || 85;
          return (
            <button
              key={cand.id}
              onClick={() => {
                setSelectedId(cand.id);
                if (onSelectCandidate) onSelectCandidate(cand);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background hover:bg-muted text-muted-foreground border-border"
              }`}
            >
              <span>{cand.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {score}/100
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Candidate Metadata & Score Breakdown */}
      {activeCandidate && (
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">{activeCandidate.name}</h4>
              <p className="text-xs text-muted-foreground">Strategy: {activeCandidate.strategyName}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-muted-foreground">Est. Tokens:</span>{" "}
              <span className="text-xs font-bold text-primary">{activeCandidate.estimatedTokens}</span>
            </div>
          </div>

          {activeCandidate.hybridScore && (
            <div className="grid grid-cols-5 gap-2 pt-2 border-t text-center text-[11px]">
              <div className="p-1.5 rounded bg-muted/40">
                <span className="block text-muted-foreground">Structural</span>
                <span className="font-bold text-foreground">{activeCandidate.hybridScore.structuralScore}/20</span>
              </div>
              <div className="p-1.5 rounded bg-muted/40">
                <span className="block text-muted-foreground">Intent</span>
                <span className="font-bold text-foreground">{activeCandidate.hybridScore.intentScore}/20</span>
              </div>
              <div className="p-1.5 rounded bg-muted/40">
                <span className="block text-muted-foreground">Constraints</span>
                <span className="font-bold text-foreground">{activeCandidate.hybridScore.constraintScore}/20</span>
              </div>
              <div className="p-1.5 rounded bg-muted/40">
                <span className="block text-muted-foreground">Eval</span>
                <span className="font-bold text-foreground">{activeCandidate.hybridScore.evaluationScore}/25</span>
              </div>
              <div className="p-1.5 rounded bg-muted/40">
                <span className="block text-muted-foreground">Efficiency</span>
                <span className="font-bold text-foreground">{activeCandidate.hybridScore.efficiencyScore}/15</span>
              </div>
            </div>
          )}

          {/* Semantic Diff */}
          <div className="pt-2">
            <h5 className="text-xs font-semibold text-muted-foreground mb-1">Semantic Diff vs Original:</h5>
            <PromptDiff originalText={originalPrompt} enhancedText={activeCandidate.renderedText} />
          </div>
        </div>
      )}
    </div>
  );
}
