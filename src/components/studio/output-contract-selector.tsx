"use client";

import { useState } from "react";
import {
  FileCode,
  FileText,
  CheckSquare,
  Table,
  Braces,
  Sparkles,
  ShieldAlert,
  Sliders,
  Check,
} from "lucide-react";

export type OutputFormat = "default" | "markdown" | "json" | "code" | "table" | "checklist";
export type TaskProfile = "general" | "coding" | "research" | "writing" | "analysis";

export interface OutputContractConfig {
  taskProfile: TaskProfile;
  format: OutputFormat;
  mandateVerification: boolean;
  strictConstraints: boolean;
}

interface OutputContractSelectorProps {
  value: OutputContractConfig;
  onChange: (config: OutputContractConfig) => void;
}

const TASK_PROFILES: { id: TaskProfile; label: string; icon: typeof Sparkles; description: string }[] = [
  { id: "general", label: "General", icon: Sparkles, description: "Balanced clarity & concise steps" },
  { id: "coding", label: "Coding", icon: FileCode, description: "Type-safety, tests & zero placeholders" },
  { id: "research", label: "Research", icon: Table, description: "Objective evidence & tradeoffs" },
  { id: "writing", label: "Writing", icon: FileText, description: "Editorial style & coherent voice" },
  { id: "analysis", label: "Analysis", icon: Sliders, description: "Structured data & analytical takeaways" },
];

const FORMAT_OPTIONS: { id: OutputFormat; label: string; icon: typeof FileText }[] = [
  { id: "default", label: "Standard Markdown", icon: FileText },
  { id: "json", label: "Strict JSON Schema", icon: Braces },
  { id: "code", label: "Clean Code Only", icon: FileCode },
  { id: "table", label: "Comparison Table", icon: Table },
  { id: "checklist", label: "Action Checklist", icon: CheckSquare },
];

export function OutputContractSelector({ value, onChange }: OutputContractSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur-md overflow-hidden transition-all shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span>Task Profile & Output Contract</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
                {value.taskProfile} · {value.format}
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Define target task requirements and structured output specifications
            </p>
          </div>
        </div>

        <span className="text-xs text-primary font-medium">
          {isOpen ? "Hide details" : "Customize"}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t space-y-4 animate-smooth-in">
          {/* Task Profile Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              1. Task Profile (Specialized Prompt Heuristics)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TASK_PROFILES.map((profile) => {
                const Icon = profile.icon;
                const isSelected = value.taskProfile === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onChange({ ...value, taskProfile: profile.id })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                        : "border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-semibold">{profile.label}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{profile.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desired Output Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              2. Output Format Contract
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {FORMAT_OPTIONS.map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = value.format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => onChange({ ...value, format: fmt.id })}
                    className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification Guardrails */}
          <div className="pt-2 border-t flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={value.mandateVerification}
                onChange={(e) => onChange({ ...value, mandateVerification: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
              />
              <span>Mandate step-by-step verification checkpoints in prompt</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={value.strictConstraints}
                onChange={(e) => onChange({ ...value, strictConstraints: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
              />
              <span>Enforce negative constraints (zero fluff, cite assumptions)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
