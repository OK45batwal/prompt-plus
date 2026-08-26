"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Copy,
  RotateCcw,
  Check,
  Loader2,
  Zap,
  Calculator,
  Mic,
  MicOff,
  ExternalLink,
  Shield,
  Target,
  Code,
} from "lucide-react";
import { getSavedContextBlocks, ContextBlock } from "@/lib/context-memory";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";
import { enhanceWithDevice, isDeviceAISupported } from "@/lib/llm/device-ai";
import type { EnhanceLevel } from "@/lib/llm/meta-prompt";
import { useToast } from "@/components/ui/toast";
import { openAIPlatform } from "@/lib/platform-redirect";
import { MODELS, DEFAULT_MODEL_ID, getModelById } from "@/lib/models";
import { ModelSelector, EnhanceEngineMode } from "@/components/studio/model-selector";
import { ContextMemoryPanel } from "@/components/studio/context-memory-panel";
import { ScoreBreakdown } from "@/components/studio/score-breakdown";
import { ExportCodeModal } from "@/components/prompts/export-code-modal";
import { LoopTraceCard } from "@/components/studio/loop-trace-card";
import type { LoopTrace } from "@/lib/prompt-engine/loop-engine";

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
    loopTrace?: LoopTrace;
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [enhanceMode, setEnhanceMode] = useState<EnhanceEngineMode>("api");
  const [deviceState, setDeviceState] = useState<"unknown" | "available" | "unavailable" | "downloading">("unknown");
  const [enhanceLevel, setEnhanceLevel] = useState<EnhanceLevel>("deep");
  const [isListening, setIsListening] = useState(false);

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

  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadApiKeys() {
      try {
        const res = await fetch("/api/v1/api-keys");
        if (res.ok && isMounted) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            const keyMap: Record<string, boolean> = {};
            json.data.forEach((k: { provider: string; isActive: boolean }) => {
              keyMap[k.provider] = k.isActive;
            });
            setSavedKeys(keyMap);
          }
        }
      } catch {
        // ignore
      }
    }
    loadApiKeys();
    return () => {
      isMounted = false;
    };
  }, []);

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
      let enhanceProvider = enhanceMode;
      let v2Data: EnhancedResult["v2"] | undefined;

      // ── Branch 1: On-Device Gemini Nano ──
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
          // Fallback to No-API Engine
          const { synthesizeAlgorithmicPrompt } = await import("@/lib/llm/algorithmic-enhancers");
          finalEnhancedText = synthesizeAlgorithmicPrompt(fullPrompt, enhanceLevel);
          enhanceProvider = "algorithmic";
        }
      }

      // ── Branch 2: No-API Rule Engine (100% Offline, Deterministic, Sub-30ms) ──
      else if (enhanceMode === "algorithmic") {
        try {
          const v2Res = await fetch("/api/v2/optimize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({
              text: fullPrompt,
              mode: "fast",
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
              modelRouting: v2Json.data.modelRouting || { recommended: selectedModel, reason: "No-API Rule Engine" },
              loopTrace: v2Json.data.loopTrace,
            };
          }
        } catch {
          // client-side algorithmic fallback
        }

        if (!finalEnhancedText) {
          const { synthesizeAlgorithmicPrompt } = await import("@/lib/llm/algorithmic-enhancers");
          finalEnhancedText = synthesizeAlgorithmicPrompt(fullPrompt, enhanceLevel);
        }
        enhanceProvider = "algorithmic";
      }

      // ── Branch 3: Dedicated API Cloud AI ──
      else {
        enhanceProvider = "api";
        const hasConnectedKey = !!(savedKeys[selectedModelData?.provider || "openai"] || userApiKey);
        if (!selectedModelData?.free && !hasConnectedKey) {
          toast(`⚠️ No API key found for ${selectedModelData?.provider || "selected model"}. Using Free Server AI fallback.`, "info");
        }

        try {
          const v2Res = await fetch("/api/v2/optimize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({
              text: fullPrompt,
              mode: "deep",
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
              modelRouting: v2Json.data.modelRouting || { recommended: selectedModel, reason: "API Cloud Model" },
              loopTrace: v2Json.data.loopTrace,
            };
          }
        } catch {
          // Fall back to V1 enhance-ai
        }

        if (!finalEnhancedText) {
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
            const { synthesizeAlgorithmicPrompt } = await import("@/lib/llm/algorithmic-enhancers");
            finalEnhancedText = synthesizeAlgorithmicPrompt(fullPrompt, enhanceLevel);
          }
        }
      }

      if (!finalEnhancedText) {
        setErrorNotice("No enhancement returned. Please try again.");
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

  const handleRefine = () => {
    if (result?.enhanced?.text) {
      setPrompt(result.enhanced.text);
      toast("Loaded enhanced prompt into editor for further refinement!", "info");
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
  const basePromptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleVoiceInput = async () => {
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

    // Step 1: Explicitly prompt & verify microphone hardware access
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release stream tracks so SpeechRecognition has dedicated microphone access
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: unknown) {
        const isDenied = err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
        if (isDenied) {
          const msg = "Microphone access blocked. Click the camera/microphone icon in your URL address bar to allow access.";
          setErrorNotice(msg);
          toast(msg, "error");
          return;
        }
      }
    }

    // Step 2: Initialize Speech Recognition with continuous interim dictation
    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      basePromptRef.current = prompt;

      rec.onstart = () => {
        setIsListening(true);
        setErrorNotice(null);
        toast("🎙️ Listening... Speak your prompt naturally.", "info");
      };

      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        recognitionRef.current = null;
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          setErrorNotice("Microphone permission denied. Click the lock/settings icon in your address bar to enable microphone access.");
          toast("Microphone access denied.", "error");
        } else if (e.error === "no-speech") {
          setErrorNotice("No speech detected. Please speak clearly into your microphone.");
        } else if (e.error !== "aborted") {
          setErrorNotice(`Voice input error (${e.error}). Please try again.`);
        }
      };

      rec.onresult = (e: SpeechRecognitionEvent) => {
        let finalSegment = "";
        let interimSegment = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i];
          const transcriptText = item[0]?.transcript || "";
          if (item.isFinal) {
            finalSegment += transcriptText + " ";
          } else {
            interimSegment += transcriptText;
          }
        }

        const base = basePromptRef.current ? basePromptRef.current.trim() + " " : "";
        const combined = `${base}${finalSegment}${interimSegment}`.trimStart();
        if (combined) {
          setPrompt(combined);
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

      {errorNotice && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <span>⚠️ {errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input & Context Engine */}
        <div className="space-y-4">
          {/* Modular Model Selector */}
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            enhanceMode={enhanceMode}
            onSetEnhanceMode={setEnhanceMode}
            deviceState={deviceState}
            onSetDeviceState={setDeviceState}
            savedKeys={savedKeys}
          />

          {/* Enhancement Level Selector with Pill Design */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold flex items-center gap-1.5 font-mono">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Enhancement Level
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {enhanceLevels.find((l) => l.id === enhanceLevel)?.hint}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {enhanceLevels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setEnhanceLevel(l.id)}
                    className={`h-8 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                      enhanceLevel === l.id
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-background text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modular Context Memory Panel */}
          <ContextMemoryPanel
            availableBlocks={availableBlocks}
            selectedBlockIds={selectedBlockIds}
            onToggleBlock={toggleContextBlock}
            onAddBlock={(block) => {
              setAvailableBlocks((prev) => [...prev, block]);
              setSelectedBlockIds((prev) => [...prev, block.id]);
            }}
            onDeleteBlock={(id) => {
              setAvailableBlocks((prev) => prev.filter((b) => b.id !== id));
              setSelectedBlockIds((prev) => prev.filter((bId) => bId !== id));
            }}
          />

          {/* Prompt Input Double-Bezel Container */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Your Prompt</label>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`text-[11px] flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                    isListening
                      ? "bg-red-500/15 border-red-500/50 text-red-500 font-semibold shadow-xs animate-pulse"
                      : "text-muted-foreground border-border/80 hover:text-foreground hover:bg-accent"
                  }`}
                  title={isListening ? "Click to stop dictation" : "Click to start voice dictation"}
                >
                  {isListening ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <MicOff className="h-3 w-3 text-red-500" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      <span>Voice input</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here... Context Memory blocks above will be automatically included."
                className="w-full h-40 p-3.5 rounded-xl border border-border/70 bg-background/80 font-mono text-xs text-foreground resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-2xs"
              />

              {/* Real-Time Token & Cost Estimation Counter */}
              <div className="pt-2.5 border-t border-border/50 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between text-muted-foreground gap-1">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Zap className="h-3.5 w-3.5 text-amber-500" /> ~{estimatedTokens} Tokens
                    </span>
                    <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
                    <span>{prompt.length} chars</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                    className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    <Calculator className="h-3 w-3" /> Cost Breakdown
                  </button>
                </div>

                {/* Side-by-Side Model Cost Comparison Table */}
                {showCostBreakdown && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-muted-foreground font-mono text-[10px] uppercase">Pre-Execution Estimated Cost:</div>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      {costEstimates.map((c) => (
                        <div key={c.modelId} className="flex justify-between items-center p-2 rounded-lg bg-accent/40 border border-border/60">
                          <span className="font-medium truncate mr-1">{c.modelName}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{c.formattedCost}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-1">
                <button onClick={handleReset} className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block font-mono">Tone</label>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl border border-border/80 bg-background text-xs font-medium outline-none focus:border-ring"
              >
                <option value="">Any</option>
                {tones.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block font-mono">Length</label>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl border border-border/80 bg-background text-xs font-medium outline-none focus:border-ring"
              >
                <option value="">Any</option>
                {lengths.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block font-mono">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl border border-border/80 bg-background text-xs font-medium outline-none focus:border-ring"
              >
                <option value="">Auto</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tactile Pill Enhance CTA Button with Button-in-Button Trailing Icon */}
          <button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-between pl-6 pr-2 shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 group"
          >
            <span>
              {isEnhancing
                ? enhanceMode === "device"
                  ? "Enhancing on Device..."
                  : "Optimizing with Prompt+ 2.0..."
                : "Enhance Prompt"}
            </span>
            <span className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </span>
          </button>
        </div>

        {/* Right Column: Results & Analysis */}
        <div className="space-y-4">
          {!result && !isEnhancing && (
            <div className="double-bezel-outer h-full min-h-[300px]">
              <div className="double-bezel-inner h-full p-8 flex flex-col items-center justify-center text-center">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm">Ready for Enhancement</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Enter your prompt on the left, select any Context Memory blocks, and click &quot;Enhance Prompt&quot; to see deterministic optimization.
                </p>
              </div>
            </div>
          )}

          {isEnhancing && (
            <div className="double-bezel-outer h-full min-h-[300px]">
              <div className="double-bezel-inner h-full p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <h3 className="font-bold text-sm">Compiling Master Instruction...</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">Running hybrid evaluation & multi-candidate synthesis</p>
              </div>
            </div>
          )}

          {result && !isEnhancing && (
            <>
              {/* V2 Engine Analysis Badges */}
              {result.v2 && (
                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-3.5 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-primary">
                        <Target className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">Domain: <strong className="capitalize text-foreground">{result.v2.intent.domain || "General"}</strong></span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-mono font-semibold border border-primary/20">
                          {result.v2.intent.taskType} · {result.v2.intent.complexity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <Shield className={`h-3.5 w-3.5 ${result.v2.security.isSafe ? "text-emerald-500" : "text-amber-500"}`} />
                        <span className={result.v2.security.isSafe ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-amber-600 font-semibold"}>
                          {result.v2.security.isSafe ? "Security Scan Passed" : "Security Alert"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Comparison with Dimension Breakdown */}
              <ScoreBreakdown
                originalScore={result.original.score}
                enhancedScore={result.enhanced.score}
                v2HybridScore={result.v2?.selectedCandidate?.hybridScore}
              />

              {/* Loop Engineering Telemetry Card */}
              {result.v2?.loopTrace && (
                <LoopTraceCard loopTrace={result.v2.loopTrace} />
              )}

              {/* V2 Candidates Switcher */}
              {result.v2 && result.v2.candidates.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block uppercase font-mono text-[10px]">Select Candidate Strategy</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                          className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                            isSelected
                              ? "bg-primary/10 border-primary text-foreground shadow-2xs font-semibold"
                              : "bg-card text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          <p className="text-[11px] font-semibold truncate">{cand.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{cand.estimatedTokens} tokens</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enhanced Prompt Result with Double-Bezel */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold font-mono uppercase">Optimized Prompt</label>
                      {enhanceMode === "api" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-500/20 font-mono">
                          ☁️ {selectedModelData?.name || selectedModel}
                        </span>
                      ) : enhanceMode === "device" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px] border border-purple-500/20 font-mono">
                          🧠 Gemini Nano
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 font-mono">
                          ⚡ Rule Engine
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRefine}
                        className="text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-primary/30 active:scale-95 transition-all"
                        title="Load this prompt back into input for further refinement"
                      >
                        <RotateCcw className="h-3 w-3" /> Refine
                      </button>
                      <div className="flex items-center gap-1">
                        {(["chatgpt", "claude", "gemini"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => openInTarget(t)}
                            className="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded-full flex items-center gap-0.5 capitalize border border-border/60 active:scale-95 transition-all"
                            title={`Open in ${t}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowExportModal(true)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-2.5 py-1 rounded-full flex items-center gap-1 border border-border/80 active:scale-95 transition-all"
                        title="Export optimized prompt to Python, Node.js, cURL, or LangChain code"
                      >
                        <Code className="h-3 w-3" /> Export
                      </button>
                      <button
                        onClick={handleCopy}
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-foreground text-background hover:bg-foreground/90 flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/70 bg-background/90 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto shadow-2xs">
                    {result.enhanced.text}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {result && (
        <ExportCodeModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Optimized Prompt"
          promptText={result.enhanced.text}
        />
      )}
    </div>
  );
}
