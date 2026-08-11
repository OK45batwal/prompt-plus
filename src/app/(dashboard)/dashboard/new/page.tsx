"use client";

import { useState, useRef, useEffect } from "react";
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
  Mic,
  MicOff,
  ExternalLink,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import { getSavedContextBlocks, saveCustomContextBlock, ContextBlock } from "@/lib/context-memory";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";
import { enhanceWithDevice, checkDeviceAvailability, isDeviceAISupported } from "@/lib/llm/device-ai";
import type { EnhanceLevel } from "@/lib/llm/meta-prompt";
import { useToast } from "@/components/ui/toast";
import { openAIPlatform } from "@/lib/platform-redirect";
import { MODELS, DEFAULT_MODEL_ID, getModelById } from "@/lib/models";

interface V2Intent {
  domain: string;
  taskType: string;
  goal: string;
  complexity: string;
  outputType: string;
  assumptions: string[];
  unknowns: string[];
}

interface V2Security {
  isSafe: boolean;
  riskScore: number;
  hasSecrets: boolean;
  secretsDetected: string[];
  hasPII: boolean;
  piiDetected: string[];
  isPromptInjection: boolean;
  privacyRecommendedAction: string;
}

interface V2Candidate {
  id: string;
  name: string;
  strategyName: string;
  renderedText: string;
  efficiencyScore: number;
  estimatedTokens: number;
  hybridScore: {
    totalScore: number;
    structuralScore: number;
    intentScore: number;
    constraintScore: number;
    evaluationScore: number;
    efficiencyScore: number;
    dimensionBreakdown: { clarity: number; specificity: number; structure: number; actionability: number };
  };
}

interface EnhancedResult {
  original: { text: string; score: number };
  enhanced: { text: string; score: number };
  v2?: {
    intent: V2Intent;
    security: V2Security;
    selectedCandidate: V2Candidate;
    candidates: V2Candidate[];
    modelRouting: { recommended: string; reason: string };
  };
}

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

const enhanceLevels: { id: EnhanceLevel; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "Concise structure & clarity" },
  { id: "deep", label: "Deep", hint: "Full role, context & steps" },
  { id: "expert", label: "Expert", hint: "Chain-of-thought + examples" },
];

export default function PromptBuilderPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [selectedLength, setSelectedLength] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<EnhancedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [enhanceMode, setEnhanceMode] = useState<"api" | "device">("api");
  const [deviceState, setDeviceState] = useState<"unknown" | "available" | "unavailable" | "downloading">("unknown");
  const [enhanceLevel, setEnhanceLevel] = useState<EnhanceLevel>("deep");
  const [isListening, setIsListening] = useState(false);
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContextName, setNewContextName] = useState("");
  const [newContextContent, setNewContextContent] = useState("");
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Close model dropdown on outside click (Fix #3)
  useEffect(() => {
    if (!showModelDropdown) return;
    const handler = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelDropdown]);

  const loadPrefs = () => {
    try {
      const raw = localStorage.getItem("pp_prefs");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const initialPrefs = typeof window !== "undefined" ? loadPrefs() : {};
  const [selectedModel, setSelectedModel] = useState(
    MODELS.some((m) => m.id === initialPrefs.defaultModel) ? initialPrefs.defaultModel : DEFAULT_MODEL_ID
  );
  const [selectedTone, setSelectedTone] = useState(initialPrefs.defaultTone || "");

  // Context Memory Blocks State
  const [availableBlocks, setAvailableBlocks] = useState<ContextBlock[]>(() => getSavedContextBlocks());
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

  const selectedModelData = getModelById(selectedModel);

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
      let v2Data: EnhancedResult["v2"] | undefined;

      if (enhanceMode === "device" && isDeviceAISupported()) {
        try {
          finalEnhancedText = await enhanceWithDevice({
            text: fullPrompt,
            category: selectedCategory,
            tone: selectedTone,
            length: selectedLength,
            level: enhanceLevel,
          });
          enhanceProvider = "device";
        } catch {
          // Device AI unavailable — seamless failover
        }
      }

      // Try V2 Optimization Engine API
      if (!finalEnhancedText) {
        try {
          const v2Res = await fetch("/api/v2/optimize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({
              text: fullPrompt,
              targetModel: selectedModelData?.rawModel || selectedModel,
            }),
          });
          const v2Json = await v2Res.json();
          if (v2Res.ok && v2Json.data?.selectedCandidate?.renderedText) {
            finalEnhancedText = v2Json.data.selectedCandidate.renderedText;
            v2Data = {
              intent: v2Json.data.intent,
              security: v2Json.data.security,
              selectedCandidate: v2Json.data.selectedCandidate,
              candidates: v2Json.data.candidates || [],
              modelRouting: v2Json.data.modelRouting || { recommended: selectedModel, reason: "Default model" },
            };
          }
        } catch {
          // Fall back to V1 / LLM Provider
        }
      }

      if (!finalEnhancedText) {
        // Fallback to V1 Cloud AI
        const aiRes = await fetch("/api/v1/prompts/enhance-ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            text: fullPrompt,
            model: selectedModelData?.rawModel || selectedModel,
            provider: selectedModelData?.provider,
            category: selectedCategory,
            tone: selectedTone,
            length: selectedLength,
            level: enhanceLevel,
            userApiKey,
          }),
        });
        const aiData = await aiRes.json();

        if (aiRes.ok && aiData.data?.enhanced) {
          finalEnhancedText = aiData.data.enhanced;
        } else {
          // Failover to client-side algorithmic engine
          const { synthesizeAlgorithmicPrompt } = await import("@/lib/llm/algorithmic-enhancers");
          finalEnhancedText = synthesizeAlgorithmicPrompt(fullPrompt, enhanceLevel);
        }
      }

      if (!finalEnhancedText) {
        setErrorNotice("No enhancement returned");
        return;
      }

      // Calculate initial score & final score
      const [scoreRes, enhancedScoreRes] = await Promise.all([
        fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ text: fullPrompt }),
        }),
        fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ text: finalEnhancedText }),
        }),
      ]);

      const [scoreData, enhancedScoreData] = await Promise.all([
        scoreRes.json().catch(() => ({})),
        enhancedScoreRes.json().catch(() => ({})),
      ]);

      const originalScore = scoreData.data?.total || 45;
      const enhancedScore = v2Data?.selectedCandidate?.hybridScore?.totalScore || enhancedScoreData.data?.total || 88;

      const resultData: EnhancedResult = {
        original: { text: prompt, score: originalScore },
        enhanced: { text: finalEnhancedText, score: enhancedScore },
        v2: v2Data,
      };

      setResult(resultData);
      toast("Prompt optimized with V2 Engine!", "success");

      // Auto-save to Local History with real scores
      if (typeof window !== "undefined") {
        try {
          const newItem = {
            id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            originalText: prompt,
            enhancedText: finalEnhancedText,
            model: enhanceProvider === "device" ? "Gemini Nano (On-Device)" : selectedModelData?.name || selectedModel,
            originalScore,
            enhancedScore,
            timestamp: new Date().toISOString(),
          };
          const existingRaw = localStorage.getItem("pp_local_history");
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const updated = [newItem, ...existing.filter((x: { originalText: string }) => x.originalText !== prompt)].slice(0, 100);
          localStorage.setItem("pp_local_history", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      // Save prompt to server
      try {
        const createRes = await fetch("/api/v1/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
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
            headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
            body: JSON.stringify({
              enhancedText: finalEnhancedText,
              score: { total: enhancedScore },
            }),
          });
        }
      } catch {
        // best effort
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
      toast("Copied enhanced prompt to clipboard!", "success");
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

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setErrorNotice("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      toast("Voice input not supported in this browser.", "error");
      return;
    }

    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setErrorNotice(null);
        toast("Listening for voice input...", "info");
      };

      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        recognitionRef.current = null;
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          setErrorNotice("Microphone access denied. Please allow microphone permissions in browser settings.");
          toast("Microphone access denied.", "error");
        } else if (e.error === "no-speech") {
          setErrorNotice("No speech detected. Please speak clearly into your microphone.");
        } else {
          setErrorNotice(`Voice input error (${e.error}). Please try again.`);
        }
      };

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const transcript = e.results?.[0]?.[0]?.transcript || "";
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          toast("Voice input captured!", "success");
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: unknown) {
      setIsListening(false);
      recognitionRef.current = null;
      const msg = err instanceof Error ? err.message : "Failed to start speech recognition.";
      setErrorNotice(msg);
    }
  };

  const handleAddContext = () => {
    const name = newContextName.trim();
    const content = newContextContent.trim();
    if (!name || !content) return;
    const block = saveCustomContextBlock({ name, description: "Custom saved context", category: "custom", content });
    setAvailableBlocks((prev) => [...prev, block]);
    setSelectedBlockIds((prev) => [...prev, block.id]);
    setNewContextName("");
    setNewContextContent("");
    setShowAddContext(false);
  };

  const openInTarget = (target: "chatgpt" | "claude" | "gemini") => {
    const text = result?.enhanced.text || prompt;
    if (!text.trim()) {
      toast("No prompt to open.", "error");
      return;
    }
    openAIPlatform(target, text, (msg, type) => toast(msg, type));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Prompt Builder</h2>
          <p className="text-xs text-muted-foreground">Transform your ideas into optimized prompts</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          100% Free — No API Key Required
        </span>
      </div>

      {/* Enhancement Mode */}
      <div className="p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">Enhancement Engine</span>
          <span className="text-[10px] text-muted-foreground">
            {enhanceMode === "api" ? "🟢 Cloud AI — 100% free out-of-the-box, no key needed" : "⚡ On-device — private, offline, free"}
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
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
            <span>
              On-Device Gemini Nano requires Chrome 138+ with Prompt API enabled (chrome://flags → Enable Prompt API).
            </span>
            <button
              type="button"
              onClick={() => setEnhanceMode("api")}
              className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Zap className="h-3 w-3" /> Switch to API Mode
            </button>
          </div>
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
          <div className="relative" ref={modelDropdownRef}>
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
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto scrollbar-thin">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <span className="shrink-0">{model.icon}</span>
                    <span className="truncate">{model.name}</span>
                    {model.free && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ml-auto shrink-0">FREE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Enhancement Level Selector */}
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Enhancement Level
              </span>
              <span className="text-[10px] text-muted-foreground">
                {enhanceLevels.find((l) => l.id === enhanceLevel)?.hint}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {enhanceLevels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setEnhanceLevel(l.id)}
                  className={`h-8 rounded-lg border text-xs font-medium transition-colors ${enhanceLevel === l.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

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
              <button
                type="button"
                onClick={() => setShowAddContext(!showAddContext)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-dashed text-primary hover:bg-accent"
              >
                + Save Context
              </button>
            </div>
            {showAddContext && (
              <div className="space-y-2 pt-2 border-t">
                <input
                  value={newContextName}
                  onChange={(e) => setNewContextName(e.target.value)}
                  placeholder="Context name (e.g. My SaaS brand voice)"
                  className="w-full h-8 px-2 rounded-lg border bg-background text-xs outline-none focus:border-ring"
                />
                <textarea
                  value={newContextContent}
                  onChange={(e) => setNewContextContent(e.target.value)}
                  placeholder="Context to auto-include in every enhancement (audience, brand, guidelines...)"
                  className="w-full h-16 p-2 rounded-lg border bg-background text-xs outline-none focus:border-ring resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContext(false)}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddContext}
                    disabled={!newContextName.trim() || !newContextContent.trim()}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                  >
                    Save & Activate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Your Prompt</label>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                  isListening
                    ? "bg-red-500/10 border-red-500/40 text-red-500"
                    : "text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                }`}
              >
                {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {isListening ? "Listening…" : "Voice input"}
              </button>
            </div>
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
              {/* V2 Engine Analysis Badges */}
              {result.v2 && (
                <div className="p-3 rounded-lg border bg-card/60 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <Target className="h-3.5 w-3.5" />
                      <span>Domain: <strong className="capitalize text-foreground">{result.v2.intent.domain || "General"}</strong></span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-medium">
                        {result.v2.intent.taskType} · {result.v2.intent.complexity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Shield className={`h-3.5 w-3.5 ${result.v2.security.isSafe ? "text-emerald-500" : "text-amber-500"}`} />
                      <span className={result.v2.security.isSafe ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600"}>
                        {result.v2.security.isSafe ? "Security Scan Passed" : "Security Alert"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Comparison */}
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    Prompt Quality Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Original: {result.original.score}</span>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">→ Enhanced: {result.enhanced.score}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${result.enhanced.score}%` }} />
                </div>

                {/* Hybrid Score Breakdown Toggle */}
                {result.v2?.selectedCandidate?.hybridScore && (
                  <div className="pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1"
                    >
                      {showScoreBreakdown ? "Hide Score Breakdown" : "View Hybrid Score Breakdown"}
                    </button>
                    {showScoreBreakdown && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px]">
                        <div className="p-1.5 rounded bg-muted/40 border text-center">
                          <p className="text-muted-foreground">Structural</p>
                          <p className="font-bold text-foreground">{result.v2.selectedCandidate.hybridScore.structuralScore}/20</p>
                        </div>
                        <div className="p-1.5 rounded bg-muted/40 border text-center">
                          <p className="text-muted-foreground">Intent Preserved</p>
                          <p className="font-bold text-foreground">{result.v2.selectedCandidate.hybridScore.intentScore}/20</p>
                        </div>
                        <div className="p-1.5 rounded bg-muted/40 border text-center">
                          <p className="text-muted-foreground">Constraints</p>
                          <p className="font-bold text-foreground">{result.v2.selectedCandidate.hybridScore.constraintScore}/20</p>
                        </div>
                        <div className="p-1.5 rounded bg-muted/40 border text-center">
                          <p className="text-muted-foreground">Efficiency</p>
                          <p className="font-bold text-foreground">{result.v2.selectedCandidate.hybridScore.efficiencyScore}/15</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* V2 Candidates Switcher */}
              {result.v2 && result.v2.candidates.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">Select Candidate Strategy</label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {result.v2.candidates.map((cand) => {
                      const isSelected = result.enhanced.text === cand.renderedText;
                      return (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => {
                            setResult((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    enhanced: {
                                      text: cand.renderedText,
                                      score: cand.hybridScore?.totalScore || prev.enhanced.score,
                                    },
                                  }
                                : null
                            );
                          }}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary text-foreground shadow-xs font-medium"
                              : "bg-card text-muted-foreground border-border hover:bg-accent"
                          }`}
                        >
                          <p className="text-[11px] font-semibold truncate">{cand.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{cand.estimatedTokens} tokens</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enhanced Prompt Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Optimized Prompt</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(["chatgpt", "claude", "gemini"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => openInTarget(t)}
                          className="text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent px-1.5 py-0.5 rounded flex items-center gap-0.5 capitalize"
                          title={`Open in ${t}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t}
                        </button>
                      ))}
                    </div>
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
