"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Sparkles,
  Zap,
  TrendingDown,
  ArrowRight,
  Cpu,
  Flame,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { LiveBackground } from "@/components/ui/live-background";
import { Logo } from "@/components/ui/logo";

interface ModelPricing {
  id: string;
  name: string;
  provider: "OpenAI" | "Anthropic" | "Google" | "DeepSeek" | "Meta";
  inputCost: number; // USD per 1M tokens
  outputCost: number; // USD per 1M tokens
  contextWindow: string;
  category: "frontier" | "fast" | "reasoning";
  badge?: string;
}

const MODELS: ModelPricing[] = [
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", inputCost: 2.50, outputCost: 10.00, contextWindow: "128k", category: "frontier", badge: "Flagship" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", inputCost: 0.15, outputCost: 0.60, contextWindow: "128k", category: "fast", badge: "Popular" },
  { id: "o1", name: "o1", provider: "OpenAI", inputCost: 15.00, outputCost: 60.00, contextWindow: "200k", category: "reasoning" },
  { id: "o3-mini", name: "o3-mini", provider: "OpenAI", inputCost: 1.10, outputCost: 4.40, contextWindow: "200k", category: "reasoning", badge: "STEM & Code" },
  // Anthropic
  { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", provider: "Anthropic", inputCost: 3.00, outputCost: 15.00, contextWindow: "200k", category: "frontier", badge: "Top Coding" },
  { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", inputCost: 0.80, outputCost: 4.00, contextWindow: "200k", category: "fast" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", inputCost: 15.00, outputCost: 75.00, contextWindow: "200k", category: "frontier" },
  // Google
  { id: "gemini-2-0-flash", name: "Gemini 2.0 Flash", provider: "Google", inputCost: 0.10, outputCost: 0.40, contextWindow: "1M", category: "fast", badge: "Ultra Fast" },
  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "Google", inputCost: 1.25, outputCost: 5.00, contextWindow: "2M", category: "frontier" },
  { id: "gemini-1-5-flash", name: "Gemini 1.5 Flash", provider: "Google", inputCost: 0.075, outputCost: 0.30, contextWindow: "1M", category: "fast", badge: "Cheapest" },
  // DeepSeek
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", inputCost: 0.55, outputCost: 2.19, contextWindow: "64k", category: "reasoning", badge: "Reasoning Value" },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", inputCost: 0.14, outputCost: 0.28, contextWindow: "64k", category: "fast" },
  // Meta
  { id: "llama-3-3-70b", name: "Llama 3.3 70B", provider: "Meta", inputCost: 0.40, outputCost: 0.40, contextWindow: "128k", category: "fast", badge: "Open Weights" },
];

const PRESETS = [
  { label: "Solo Developer", prompts: 25, input: 800, output: 400, desc: "Personal hacking & coding partner" },
  { label: "Active Team", prompts: 120, input: 1500, output: 750, desc: "Daily code reviews, docs & analysis" },
  { label: "Heavy RAG / Agent", prompts: 400, input: 4500, output: 1200, desc: "Autonomous multi-step loops" },
  { label: "Enterprise Fleet", prompts: 1800, input: 3200, output: 900, desc: "Production API service tier" },
];

export default function PromptCostCalculatorPage() {
  const [promptsPerDay, setPromptsPerDay] = useState(40);
  const [avgInputTokens, setAvgInputTokens] = useState(1200);
  const [avgOutputTokens, setAvgOutputTokens] = useState(500);
  const [daysPerMonth, setDaysPerMonth] = useState<30 | 22>(30);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Computed metrics
  const monthlyPrompts = promptsPerDay * daysPerMonth;
  const totalInputTokensMonthly = monthlyPrompts * avgInputTokens;
  const totalOutputTokensMonthly = monthlyPrompts * avgOutputTokens;
  const totalTokensMonthly = totalInputTokensMonthly + totalOutputTokensMonthly;

  const modelCalculations = useMemo(() => {
    return MODELS.map((m) => {
      const dailyInput = (promptsPerDay * avgInputTokens / 1_000_000) * m.inputCost;
      const dailyOutput = (promptsPerDay * avgOutputTokens / 1_000_000) * m.outputCost;
      const dailyTotal = dailyInput + dailyOutput;
      const monthlyTotal = dailyTotal * daysPerMonth;
      const annualTotal = monthlyTotal * 12;
      const costPer1k = promptsPerDay > 0 ? (dailyTotal / promptsPerDay) * 1000 : 0;
      const inputRatio = dailyTotal > 0 ? (dailyInput / dailyTotal) * 100 : 50;

      return {
        ...m,
        dailyTotal,
        monthlyTotal,
        annualTotal,
        costPer1k,
        inputRatio,
      };
    });
  }, [promptsPerDay, avgInputTokens, avgOutputTokens, daysPerMonth]);

  const filteredModels = useMemo(() => {
    if (selectedProvider === "all") return modelCalculations;
    return modelCalculations.filter((m) => m.provider.toLowerCase() === selectedProvider.toLowerCase());
  }, [modelCalculations, selectedProvider]);

  const cheapestModel = useMemo(() => {
    return [...modelCalculations].sort((a, b) => a.monthlyTotal - b.monthlyTotal)[0];
  }, [modelCalculations]);

  const benchmarkModel = useMemo(() => {
    return modelCalculations.find((m) => m.id === "claude-3-7-sonnet") || modelCalculations[0];
  }, [modelCalculations]);

  // Prompt+ optimization savings estimate (28% average token reduction)
  const estimatedMonthlySavings = benchmarkModel.monthlyTotal * 0.28;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setPromptsPerDay(preset.prompts);
    setAvgInputTokens(preset.input);
    setAvgOutputTokens(preset.output);
    setActivePreset(preset.label);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground">
      {/* Live Aceternity Aurora & Neural Waves */}
      <LiveBackground className="opacity-90 dark:opacity-85" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingNav />

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full space-y-12">
          {/* Header Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-medium tracking-wide">
              <Calculator className="h-3.5 w-3.5" />
              <span>TOKENOMICS & INFERENCE FORECASTER</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              AI Token Cost Calculator
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Calculate and compare monthly API inference costs across OpenAI, Anthropic, Google, and DeepSeek.
              Simulate workloads, uncover hidden context burn, and forecast scaling budgets.
            </p>
          </div>

          {/* Quick Workload Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>WORKLOAD PRESETS</span>
              <span>1-click baseline configurations</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    activePreset === preset.label
                      ? "border-cyan-500 bg-cyan-500/10 shadow-sm"
                      : "border-border/80 bg-card/65 hover:border-cyan-500/40 hover:bg-card/90"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-foreground">{preset.label}</span>
                    {activePreset === preset.label && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                    {preset.desc}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                    <span>{preset.prompts}/day</span>
                    <span>•</span>
                    <span>{preset.input + preset.output} tok/req</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Calculator Deck & KPI Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Control Deck (5 Cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl border border-border/80 dark:border-white/10 bg-card/85 backdrop-blur-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-cyan-500" />
                  <h2 className="font-bold text-sm tracking-tight">Workload Parameters</h2>
                </div>
                <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDaysPerMonth(30)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      daysPerMonth === 30 ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    30d Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysPerMonth(22)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      daysPerMonth === 22 ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    22 Workdays
                  </button>
                </div>
              </div>

              {/* Slider 1: Prompts Per Day */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="prompts-range" className="font-semibold text-foreground">
                    Prompts Per Day
                  </label>
                  <span className="font-mono font-bold text-cyan-500 text-sm">
                    {promptsPerDay.toLocaleString()} reqs
                  </span>
                </div>
                <input
                  id="prompts-range"
                  type="range"
                  min="5"
                  max="2000"
                  step="5"
                  value={promptsPerDay}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setPromptsPerDay(isNaN(parsed) ? 5 : Math.max(1, parsed));
                    setActivePreset(null);
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>5/day</span>
                  <span>500/day</span>
                  <span>2,000/day</span>
                </div>
              </div>

              {/* Input Tokens */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="input-tokens-num" className="font-semibold text-foreground">
                    Average Input Tokens
                  </label>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {avgInputTokens.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  id="input-tokens-num"
                  type="number"
                  min="50"
                  max="128000"
                  step="50"
                  value={avgInputTokens}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setAvgInputTokens(isNaN(parsed) ? 50 : Math.max(10, parsed));
                    setActivePreset(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border/80 bg-background/80 outline-none focus:border-cyan-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[500, 1200, 3000, 8000, 16000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setAvgInputTokens(val);
                        setActivePreset(null);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
                        avgInputTokens === val
                          ? "border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Tokens */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="output-tokens-num" className="font-semibold text-foreground">
                    Average Output Tokens
                  </label>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {avgOutputTokens.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  id="output-tokens-num"
                  type="number"
                  min="20"
                  max="16000"
                  step="50"
                  value={avgOutputTokens}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setAvgOutputTokens(isNaN(parsed) ? 20 : Math.max(10, parsed));
                    setActivePreset(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border/80 bg-background/80 outline-none focus:border-cyan-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[250, 500, 1000, 2000, 4000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setAvgOutputTokens(val);
                        setActivePreset(null);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
                        avgOutputTokens === val
                          ? "border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Volume Metric Box */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Monthly Token Burn:</span>
                  <span className="font-mono font-bold text-foreground">
                    {(totalTokensMonthly / 1_000_000).toFixed(2)}M tokens
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Input: {(totalInputTokensMonthly / 1_000_000).toFixed(2)}M</span>
                  <span>Output: {(totalOutputTokensMonthly / 1_000_000).toFixed(2)}M</span>
                </div>
              </div>
            </div>

            {/* Right KPI Summary Cards (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Top Highlights 3-Card Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card 1: Cheapest Option */}
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      Most Economical
                    </span>
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <p className="text-base font-bold text-foreground truncate">
                    {cheapestModel.name}
                  </p>
                  <p className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${cheapestModel.monthlyTotal.toFixed(2)}
                    <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>

                {/* Card 2: Frontier Flagship */}
                <div className="p-4 rounded-2xl border border-border/80 bg-card/85 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Frontier Tier (3.7)
                    </span>
                    <Cpu className="h-3.5 w-3.5 text-cyan-500" />
                  </div>
                  <p className="text-base font-bold text-foreground truncate">
                    Claude 3.7 Sonnet
                  </p>
                  <p className="text-xl font-mono font-extrabold text-foreground">
                    ${benchmarkModel.monthlyTotal.toFixed(2)}
                    <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>

                {/* Card 3: Potential Prompt+ Optimization Savings */}
                <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                      Prompt+ Savings
                    </span>
                    <TrendingDown className="h-3.5 w-3.5 text-cyan-500" />
                  </div>
                  <p className="text-base font-bold text-foreground">
                    ~28% Reduction
                  </p>
                  <p className="text-xl font-mono font-extrabold text-cyan-500">
                    -${estimatedMonthlySavings.toFixed(2)}
                    <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
              </div>

              {/* Provider Filter Bar */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">Filter Provider:</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {["all", "OpenAI", "Anthropic", "Google", "DeepSeek", "Meta"].map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSelectedProvider(prov)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedProvider.toLowerCase() === prov.toLowerCase()
                          ? "bg-cyan-500 text-slate-950 font-semibold shadow-2xs"
                          : "border border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      {prov === "all" ? "All Models" : prov}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comprehensive Breakdown Table */}
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/85 backdrop-blur-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">Model & Tier</th>
                        <th className="py-3 px-3">Provider Rates (1M)</th>
                        <th className="py-3 px-3">Cost / 1k Reqs</th>
                        <th className="py-3 px-3 text-right">Daily Cost</th>
                        <th className="py-3 px-4 text-right">Monthly Forecast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {filteredModels.map((m) => {
                        const isCheapest = m.id === cheapestModel.id;
                        return (
                          <tr
                            key={m.id}
                            className={`hover:bg-muted/30 transition-colors ${
                              isCheapest ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-sans font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs">{m.name}</span>
                                {m.badge && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-sans font-medium">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {m.provider} · {m.contextWindow} ctx
                              </span>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground text-[11px]">
                              <div>In: ${m.inputCost.toFixed(2)}</div>
                              <div>Out: ${m.outputCost.toFixed(2)}</div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              ${m.costPer1k.toFixed(3)}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-foreground">
                              ${m.dailyTotal.toFixed(3)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-foreground">
                              ${m.monthlyTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Disclaimer Note */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                * Prices based on official list rates per million tokens as of 2026. Actual billing may vary with cached prompts, batch inference discounts, or custom enterprise agreements.
              </p>
            </div>
          </div>

          {/* Prompt Engineering Cost Optimization Banner */}
          <div className="p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-linear-to-r from-cyan-500/10 via-card/90 to-indigo-500/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                <Sparkles className="h-4 w-4" />
                <span>HOW PROMPT+ LOWERS TOKEN INVOICES</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Deterministic Token Pruning & Structural Framing
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Prompt+ strips conversational fluff, compresses repetitive instructions, and enforces structured outputs — saving up to 35% on input/output tokens per generation without degrading accuracy.
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm shadow-md hover:shadow-cyan-500/25 active:scale-95 transition-all shrink-0"
            >
              <span>Test Free in Prompt+ Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="py-12 px-4 sm:px-6 border-t border-border/50 bg-background/80 backdrop-blur-xl mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <Logo size={20} />
              </Link>
              <span>© {new Date().getFullYear()} Prompt+ Architect AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/prompt-engineering-guide" className="hover:text-foreground transition-colors">
                Guide
              </Link>
              <Link href="/prompt-cost-calculator" className="hover:text-foreground font-semibold text-cyan-500 transition-colors">
                Cost Calculator
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
