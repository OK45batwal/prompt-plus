"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Copy, Save, Download, RotateCcw, ChevronDown, Check, Loader2, Zap, Target, Lightbulb, TrendingUp } from "lucide-react";

type Model = "gpt-4" | "claude-3" | "gemini-pro" | "grok" | "deepseek" | "ollama" | "lm-studio" | "midjourney" | "stable-diffusion";

interface Analysis {
  intent: string;
  category: string;
  complexity: number;
  confidence: number;
  entities: string[];
  missing: { field: string; label: string; priority: string }[];
  suggestions: { text: string; impact: string; category: string }[];
}

interface Scoring {
  total: number;
  dimensions: {
    clarity: number;
    specificity: number;
    structure: number;
    context: number;
    length: number;
    actionability: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface EnhancedResult {
  original: { text: string; score: number; analysis: Analysis };
  enhanced: { text: string; score: number; explanation: string; improvements: { aspect: string; change: string; reason: string }[] };
  scoring: Scoring;
  enhancedScoring: Scoring;
}

const models: { id: Model; name: string; icon: string; free: boolean }[] = [
  { id: "gpt-4", name: "GPT-4", icon: "🤖", free: false },
  { id: "claude-3", name: "Claude 3", icon: "🧠", free: false },
  { id: "gemini-pro", name: "Gemini Pro", icon: "✨", free: false },
  { id: "grok", name: "Grok", icon: "⚡", free: false },
  { id: "deepseek", name: "DeepSeek", icon: "🔍", free: false },
  { id: "ollama", name: "Ollama (Local)", icon: "🦙", free: true },
  { id: "lm-studio", name: "LM Studio (Local)", icon: "🖥️", free: true },
  { id: "midjourney", name: "Midjourney", icon: "🎨", free: false },
  { id: "stable-diffusion", name: "Stable Diffusion", icon: "🖼️", free: true },
];

const tones = ["Professional", "Casual", "Friendly", "Formal", "Technical", "Creative", "Humorous", "Empathetic"];
const lengths = ["Short", "Medium", "Long", "Very Long"];
const categories = ["Blog Post", "Email", "Social Media", "Code", "Tutorial", "Documentation", "Marketing", "Education", "Other"];

export default function PromptBuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model>("gpt-4");
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedLength, setSelectedLength] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<EnhancedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const selectedModelData = models.find((m) => m.id === selectedModel);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/v1/prompts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt }),
      });
      const data = await res.json();
      // Analysis is part of the result, we'll use enhance-all for full result
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);

    try {
      // Call real AI endpoint
      const aiRes = await fetch("/api/v1/prompts/enhance-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prompt,
          model: selectedModel,
          category: selectedCategory,
          tone: selectedTone,
          length: selectedLength,
        }),
      });
      const aiData = await aiRes.json();

      // Get scoring and analysis
      const [analyzeRes, scoreRes, enhancedScoreRes] = await Promise.all([
        fetch("/api/v1/prompts/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt }),
        }),
        fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt }),
        }),
        fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: aiData.data.enhanced }),
        }),
      ]);

      const [analyzeData, scoreData, enhancedScoreData] = await Promise.all([
        analyzeRes.json(),
        scoreRes.json(),
        enhancedScoreRes.json(),
      ]);

      setResult({
        original: {
          text: prompt,
          score: scoreData.data.total,
          analysis: analyzeData.data,
        },
        enhanced: {
          text: aiData.data.enhanced,
          score: enhancedScoreData.data.total,
          explanation: aiData.data.provider === "openai"
            ? "Enhanced using GPT-4 with expert role, structure, and quality requirements."
            : "Enhanced using local enhancement (no API key configured).",
          improvements: [
            { aspect: "Role", change: "Added expert role", reason: "Defines the AI's expertise" },
            { aspect: "Structure", change: "Improved organization", reason: "Makes output more scannable" },
            { aspect: "Specificity", change: "Added quality requirements", reason: "Ensures detailed responses" },
          ],
        },
        scoring: scoreData.data,
        enhancedScoring: enhancedScoreData.data,
      });
    } catch (error) {
      console.error("Enhancement failed:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = () => {
    if (result?.enhanced.text) {
      navigator.clipboard.writeText(result.enhanced.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setResult(null);
    setSelectedTone("");
    setSelectedLength("");
    setSelectedCategory("");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Prompt Builder</h1>
            <p className="text-xs text-muted-foreground">Transform your ideas into optimized prompts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">5 free remaining today</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Model Selector */}
          <div className="relative">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Model</label>
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full h-10 flex items-center justify-between px-3 rounded-lg border bg-background text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{selectedModelData?.icon}</span>
                <span>{selectedModelData?.name}</span>
                {selectedModelData?.free && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">FREE</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showModelDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg py-1">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span>{model.icon}</span>
                    <span>{model.name}</span>
                    {model.free && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 ml-auto">FREE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here... Be as specific as possible for best results."
              className="w-full h-48 p-3 rounded-lg border bg-background text-sm resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">{prompt.split(/\s+/).filter(Boolean).length} words</span>
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tone</label>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
              >
                <option value="">Any</option>
                {tones.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Length</label>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
              >
                <option value="">Any</option>
                {lengths.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
              >
                <option value="">Any</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhance Button */}
          <button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            className="w-full h-11 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance Prompt
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm">Enhanced Prompt</h2>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={handleCopy}
                    className="h-8 inline-flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button className="h-8 inline-flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors">
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </button>
                  <button className="h-8 inline-flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors">
                    <Download className="h-3.5 w-3.5 mr-1" /> Export
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.enhanced.text}</p>
              </div>
              <p className="text-xs text-muted-foreground">{result.enhanced.explanation}</p>
            </div>
          )}
        </div>

        {/* Right: Analysis & Scoring */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Score Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-lg border ${getScoreBg(result.original.score)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Original</span>
                  </div>
                  <p className={`text-3xl font-bold ${getScoreColor(result.original.score)}`}>{result.original.score}</p>
                </div>
                <div className={`p-4 rounded-lg border ${getScoreBg(result.enhanced.score)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Enhanced</span>
                    <span className="text-xs text-green-600 font-medium">+{result.enhanced.score - result.original.score}</span>
                  </div>
                  <p className={`text-3xl font-bold ${getScoreColor(result.enhanced.score)}`}>{result.enhanced.score}</p>
                </div>
              </div>

              {/* Dimensions */}
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" /> Score Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(result.enhancedScoring.dimensions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 capitalize">{key}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Improvements Made
                </h3>
                <div className="space-y-2">
                  {result.enhanced.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{imp.change}</p>
                        <p className="text-xs text-muted-foreground">{imp.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Recommendations
                </h3>
                <div className="space-y-2">
                  {result.enhancedScoring.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Placeholder */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Ready to enhance</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Enter your prompt and click &quot;Enhance Prompt&quot; to see AI-powered analysis and improvements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
