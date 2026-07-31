"use client";

import { useState } from "react";
import {
  Sparkles,
  Copy,
  RotateCcw,
  ChevronDown,
  Check,
  Loader2,
  Brain,
  Zap,
  Calculator,
  PlusCircle,
} from "lucide-react";
import { getSavedContextBlocks, ContextBlock } from "@/lib/context-memory";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";
import { enhanceWithDevice, checkDeviceAvailability, isDeviceAISupported } from "@/lib/llm/device-ai";

type Model =
  | "openrouter-llama3-free"
  | "openrouter-gemini-flash-free"
  | "openrouter-deepseek-r1-free"
  | "openrouter-qwen-coder-free"
  | "openrouter-mistral-small-free"
  | "openrouter-phi3-free"
  | "openrouter-hermes3-free"
  | "nvidia-llama3"
  | "nvidia-nemotron"
  | "nvidia-gemma2"
  | "nvidia-mistral"
  | "gpt-4"
  | "claude-3"
  | "gemini-pro"
  | "grok"
  | "deepseek";

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
  enhanced: {
    text: string;
    score: number;
    explanation: string;
    improvements: { aspect: string; change: string; reason: string }[];
  };
  scoring: Scoring;
  enhancedScoring: Scoring;
}

const models: { id: Model; name: string; icon: string; free: boolean; provider?: string; rawModel?: string }[] = [
  { id: "openrouter-llama3-free", name: "Llama 3.3 70B (OpenRouter Free)", icon: "🦙", free: true, provider: "openrouter", rawModel: "meta-llama/llama-3.3-70b-instruct:free" },
  { id: "openrouter-gemini-flash-free", name: "Gemini 2.0 Flash (OpenRouter Free)", icon: "⚡", free: true, provider: "openrouter", rawModel: "google/gemini-2.0-flash-exp:free" },
  { id: "openrouter-deepseek-r1-free", name: "DeepSeek R1 (OpenRouter Free)", icon: "🧠", free: true, provider: "openrouter", rawModel: "deepseek/deepseek-r1:free" },
  { id: "openrouter-qwen-coder-free", name: "Qwen 2.5 Coder 32B (OpenRouter Free)", icon: "💻", free: true, provider: "openrouter", rawModel: "qwen/qwen-2.5-coder-32b-instruct:free" },
  { id: "openrouter-mistral-small-free", name: "Mistral Small 24B (OpenRouter Free)", icon: "🌬️", free: true, provider: "openrouter", rawModel: "mistralai/mistral-small-24b-instruct-2501:free" },
  { id: "openrouter-phi3-free", name: "Phi-3 Mini 128K (OpenRouter Free)", icon: "🔬", free: true, provider: "openrouter", rawModel: "microsoft/phi-3-mini-128k-instruct:free" },
  { id: "openrouter-hermes3-free", name: "Hermes 3 405B (OpenRouter Free)", icon: "🏛️", free: true, provider: "openrouter", rawModel: "nousresearch/hermes-3-llama-3.1-405b:free" },
  { id: "nvidia-llama3", name: "Llama 3.3 70B (NVIDIA)", icon: "🦙", free: true, provider: "nvidia", rawModel: "nvidia/llama-3.3-70b-instruct" },
  { id: "nvidia-nemotron", name: "Nemotron 70B (NVIDIA)", icon: "⚡", free: true, provider: "nvidia", rawModel: "nvidia/llama-3.1-nemotron-70b-instruct" },
  { id: "nvidia-gemma2", name: "Gemma 2 27B (NVIDIA)", icon: "🔷", free: true, provider: "nvidia", rawModel: "google/gemma-2-27b-it" },
  { id: "nvidia-mistral", name: "Mistral 7B (NVIDIA)", icon: "🌬️", free: true, provider: "nvidia", rawModel: "mistralai/mistral-7b-instruct-v0.3" },
  { id: "gpt-4", name: "GPT-4o / GPT-4", icon: "🟢", free: true },
  { id: "claude-3", name: "Claude 3.5 Sonnet", icon: "🟣", free: true },
  { id: "gemini-pro", name: "Gemini 1.5 Pro", icon: "🔵", free: true },
  { id: "grok", name: "Grok 2", icon: "⚡", free: false },
  { id: "deepseek", name: "DeepSeek V3", icon: "🐋", free: false },
];

const tones = [
  "Professional",
  "Casual",
  "Friendly",
  "Formal",
  "Technical",
  "Creative",
  "Humorous",
  "Empathetic",
];
const lengths = ["Short", "Medium", "Long", "Very Long"];
const categories = [
  "Finance & Banking",
  "Blog Post",
  "Email",
  "Social Media",
  "Code",
  "Tutorial",
  "Documentation",
  "Marketing",
  "Education",
  "Other",
];

export default function PromptBuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model>("gpt-4");
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedLength, setSelectedLength] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<EnhancedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [enhanceMode, setEnhanceMode] = useState<"api" | "device">("api");
  const [deviceState, setDeviceState] = useState<"unknown" | "available" | "unavailable" | "downloading">("unknown");

  // Context Memory Blocks State
  const [availableBlocks] = useState<ContextBlock[]>(() => getSavedContextBlocks());
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>(["nextjs-tailwind"]);

  const toggleContextBlock = (id: string) => {
    setSelectedBlockIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  const getCombinedPromptWithContext = () => {
    const activeBlocks = availableBlocks.filter((b) => selectedBlockIds.includes(b.id));
    if (activeBlocks.length === 0) return prompt;
    const contextPrefix = activeBlocks.map((b) => `[Context Memory: ${b.name}]\n${b.content}`).join("\n\n");
    return `${contextPrefix}\n\n[User Prompt]:\n${prompt}`;
  };

  const selectedModelData = models.find((m) => m.id === selectedModel);

  // Token & Cost Calculations
  const combinedText = getCombinedPromptWithContext();
  const estimatedTokens = estimateTokenCount(combinedText);
  const costEstimates = calculateCostEstimates(combinedText);

  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setErrorNotice(null);

    const fullPrompt = getCombinedPromptWithContext();

    let userApiKey: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("promptplus_user_apikeys");
        if (raw) {
          const localMap = JSON.parse(raw);
          const targetProv = selectedModelData?.provider || "openai";
          userApiKey = localMap[targetProv] || localMap["openrouter"] || localMap["openai"] || localMap["anthropic"] || localMap["nvidia"];
        }
      } catch {
        // ignore
      }
    }

    try {
      let finalEnhancedText: string | undefined;
      let enhanceProvider = "api";

      if (enhanceMode === "device") {
        if (!isDeviceAISupported()) {
          setErrorNotice("Device AI not supported in this browser. Use Chrome 138+ with Gemini Nano, or switch to API mode.");
          return;
        }
        finalEnhancedText = await enhanceWithDevice({
          text: fullPrompt,
          category: selectedCategory,
          tone: selectedTone,
          length: selectedLength,
        });
        enhanceProvider = "device";
      } else {
        // Call real AI endpoint
        const aiRes = await fetch("/api/v1/prompts/enhance-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: fullPrompt,
            model: selectedModelData?.rawModel || selectedModel,
            provider: selectedModelData?.provider,
            category: selectedCategory,
            tone: selectedTone,
            length: selectedLength,
            userApiKey,
          }),
        });
        const aiData = await aiRes.json();

        if (!aiRes.ok) {
          const errMsg = aiData.error || "Enhancement failed";
          setErrorNotice(errMsg);
          return;
        }

        finalEnhancedText = aiData.data?.enhanced;
      }

      if (!finalEnhancedText) {
        setErrorNotice("No enhancement returned");
        return;
      }

      // Get scoring and analysis
      const [analyzeRes, scoreRes, enhancedScoreRes] = await Promise.all([
        fetch("/api/v1/prompts/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullPrompt }),
        }),
        fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullPrompt }),
        }),
        fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: finalEnhancedText }),
        }),
      ]);

      const [analyzeData, scoreData, enhancedScoreData] = await Promise.all([
        analyzeRes.json().catch(() => ({})),
        scoreRes.json().catch(() => ({})),
        enhancedScoreRes.json().catch(() => ({})),
      ]);

      const resultData = {
        original: {
          text: prompt,
          score: scoreData.data?.total || 0,
          analysis: analyzeData.data || { intent: "", category: "", complexity: 0, confidence: 0, entities: [], missing: [], suggestions: [] },
        },
        enhanced: {
          text: finalEnhancedText,
          score: enhancedScoreData.data?.total || 0,
          explanation: "",
          improvements: [],
        },
        scoring: scoreData.data || { total: 0, dimensions: { clarity: 0, specificity: 0, structure: 0, context: 0, length: 0, actionability: 0 }, strengths: [], weaknesses: [], recommendations: [] },
        enhancedScoring: enhancedScoreData.data || { total: 0, dimensions: { clarity: 0, specificity: 0, structure: 0, context: 0, length: 0, actionability: 0 }, strengths: [], weaknesses: [], recommendations: [] },
      };
      setResult(resultData);

      // Save prompt and results to the server
      try {
        const createRes = await fetch("/api/v1/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalText: fullPrompt,
            model: enhanceProvider === "device" ? "gemini-nano" : selectedModelData?.rawModel || selectedModel,
            category: selectedCategory || null,
            tone: selectedTone || null,
            length: selectedLength || null,
          }),
        });
        const createJson = await createRes.json();
        const promptId = createJson.data?.id;
        if (promptId) {
          await fetch(`/api/v1/prompts/${promptId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              enhancedText: finalEnhancedText,
              score: resultData.scoring,
              analysis: resultData.original.analysis,
            }),
          });
        }
      } catch {
        // saving is best-effort, don't block the UI
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
      setErrorNotice("Network error. Please try again.");
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Prompt Builder</h2>
          <p className="text-xs text-muted-foreground">Transform your ideas into optimized prompts</p>
        </div>
        <span className="text-xs text-muted-foreground">Free for all users — no daily limit</span>
      </div>

      {/* Enhancement Mode */}
      <div className="p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">Enhancement Mode</span>
          <span className="text-[10px] text-muted-foreground">
            {enhanceMode === "api" ? "⚡ Cloud AI — any model, needs an API key" : "📱 On-device — private, offline, free"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEnhanceMode("api")}
            className={`h-9 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${enhanceMode === "api"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
          >
            <Zap className="h-3.5 w-3.5" /> API Based
          </button>
          <button
            type="button"
            onClick={() => {
              setEnhanceMode("device");
              if (isDeviceAISupported()) {
                checkDeviceAvailability().then(setDeviceState).catch(() => setDeviceState("unavailable"));
              } else {
                setDeviceState("unavailable");
              }
            }}
            className={`h-9 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${enhanceMode === "device"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
          >
            <Brain className="h-3.5 w-3.5" /> On-Device (Gemini Nano)
          </button>
        </div>
        {enhanceMode === "device" && deviceState === "unavailable" && (
          <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
            Not supported in this browser. Use Chrome 138+ with Gemini Nano enabled (Settings → Experimental AI → Prompt API), or switch to API mode.
          </p>
        )}
      </div>

      {errorNotice && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <span>⚠️ {errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input & Context Engine */}
        <div className="space-y-4">
          {/* Model Selector */}
          {enhanceMode === "api" && (
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">FREE</span>
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ml-auto">FREE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Context Memory & System Rules Engine Selector */}
          <div className="p-3 rounded-lg border bg-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-blue-500" /> Context Memory & System Rules
              </span>
              <span className="text-[10px] text-muted-foreground">
                {selectedBlockIds.length} active block{selectedBlockIds.length !== 1 && "s"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableBlocks.map((block) => {
                const isActive = selectedBlockIds.includes(block.id);
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => toggleContextBlock(block.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${isActive
                        ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                  >
                    {isActive ? <Check className="h-3 w-3" /> : <PlusCircle className="h-3 w-3 opacity-60" />}
                    {block.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here... Context Memory blocks above will be automatically included."
              className="w-full h-40 p-3 rounded-lg border bg-background text-sm resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring placeholder:text-muted-foreground font-sans"
            />

            {/* Real-Time Token & Cost Estimation Counter */}
            <div className="mt-2 p-2.5 rounded-lg border bg-card text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between text-muted-foreground gap-1">
                  <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> ~{estimatedTokens} Tokens
                  </span>
                  <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{prompt.length} chars</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Calculator className="h-3 w-3" /> Cost Breakdown
                </button>
              </div>

              {/* Side-by-Side Model Cost Comparison Table */}
              {showCostBreakdown && (
                <div className="pt-2 border-t space-y-1.5 text-[11px]">
                  <div className="font-semibold text-muted-foreground">Pre-Execution Estimated Cost:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {costEstimates.map((c) => (
                      <div key={c.modelId} className="flex justify-between items-center p-1.5 rounded bg-accent/40 border">
                        <span className="font-medium truncate mr-1">{c.modelName}</span>
                        <span className="font-mono text-green-600 dark:text-green-400">{c.formattedCost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end mt-1">
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="">Auto</option>
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
            className="w-full h-11 rounded-lg bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {enhanceMode === "device" ? "Enhancing on Device..." : "Enhancing with Context..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {enhanceMode === "device" ? "Enhance On-Device" : "Enhance Prompt"}
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results & Analysis */}
        <div className="space-y-4">
          {!result && !isEnhancing && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-card/50">
              <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium text-sm">No Result Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Enter your prompt on the left, select any Context Memory blocks, and click &quot;Enhance Prompt&quot; to see AI optimization.
              </p>
            </div>
          )}

          {isEnhancing && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-card/50">
              <Loader2 className="h-8 w-8 animate-spin text-foreground mb-2" />
              <h3 className="font-medium text-sm">Enhancing Prompt...</h3>
              <p className="text-xs text-muted-foreground mt-1">Applying context rules and running model evaluation</p>
            </div>
          )}

          {result && !isEnhancing && (
            <>
              {/* Score Comparison */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold">Prompt Quality Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Original: {result.original.score}</span>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">→ Enhanced: {result.enhanced.score}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${result.enhanced.score}%` }} />
                </div>
              </div>

              {/* Enhanced Prompt Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Optimized Prompt</label>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {result.enhanced.text}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
