"use client";

import { useState, useRef, useEffect, Suspense, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
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
  ChevronDown,
} from "lucide-react";
import { getSavedContextBlocks, DEFAULT_CONTEXT_BLOCKS, ContextBlock } from "@/lib/context-memory";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";
import type { EnhanceLevel } from "@/lib/llm/meta-prompt";
import { useToast } from "@/components/ui/toast";
import { openAIPlatform } from "@/lib/platform-redirect";
import { MODELS, DEFAULT_MODEL_ID, getModelById } from "@/lib/models";
import { ModelSelector } from "@/components/studio/model-selector";
import { ContextMemoryPanel } from "@/components/studio/context-memory-panel";
import { LiveEvaluation } from "@/components/studio/live-evaluation";
import { isScore } from "@/lib/score-summary";
import { ScoreBreakdown } from "@/components/studio/score-breakdown";
import { ExportCodeModal } from "@/components/prompts/export-code-modal";
import { LoopTraceCard } from "@/components/studio/loop-trace-card";
import { PromptDiff } from "@/components/studio/prompt-diff";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  estimatedTokens: number;
  hybridScore: {
    totalScore: number;
    structuralScore: number;
    intentScore: number;
    constraintScore: number;
    evaluationScore: number | null;
    efficiencyScore: number;
    dimensionBreakdown: { clarity: number; specificity: number; structure: number; actionability: number | null };
  };
}

interface EnhancedResult {
  promptId?: string;
  source: string;
  model?: string;
  saved?: boolean;
  dimensions?: { clarity: number; specificity: number; structure: number; context: number; actionability: number };
  original: { text: string; score: number | null };
  enhanced: { text: string; score: number | null };
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
  { id: "expert", label: "Expert", hint: "Detailed constraints & examples" },
];

const resultTabs = [
  { id: "output", label: "Output" },
  { id: "changes", label: "Changes" },
] as const;

const DRAFT_KEY = "pp_studio_draft";

function PromptBuilderPage() {
  const { toast } = useToast();

  // Handoff links (Library, History) and the browser extension's "Web Studio" pass the
  // prompt in the query string. Before this the Studio ignored it and opened empty.
  const searchParams = useSearchParams();
  const handoffPrompt = searchParams.get("prompt");
  const handoffPromptId = searchParams.get("promptId");
  const handoffTone = searchParams.get("tone");

  const [prompt, setPrompt] = useState(handoffPrompt || "");
  const [selectedLength, setSelectedLength] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<EnhancedResult | null>(null);
  const [resultView, setResultView] = useState<"output" | "changes">("output");
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [enhanceLevel, setEnhanceLevel] = useState<EnhanceLevel>("deep");
  const [isListening, setIsListening] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const resultRef = useRef<HTMLElement>(null);

  // Storage-derived defaults are applied after mount so the first client render
  // matches the server; reading them here would make the two disagree.
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [selectedTone, setSelectedTone] = useState(
    // The extension ships its own tone vocabulary, so only exact Studio tones apply.
    handoffTone && tones.includes(handoffTone) ? handoffTone : ""
  );

  useEffect(() => {
    if (!handoffPromptId) return;
    let isMounted = true;
    fetch(`/api/v1/prompts/${handoffPromptId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("not found"))))
      .then((json) => {
        const text = json?.data?.originalText;
        if (isMounted && typeof text === "string") setPrompt(text);
      })
      .catch(() => {
        if (isMounted) toast("Could not load that saved prompt.", "error");
      });
    return () => {
      isMounted = false;
    };
  }, [handoffPromptId, toast]);

  // Context Memory Blocks State
  const [availableBlocks, setAvailableBlocks] = useState<ContextBlock[]>(DEFAULT_CONTEXT_BLOCKS);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);

  const toggleContextBlock = (id: string) => {
    setSelectedBlockIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  const getContextPrefix = () => {
    const activeBlocks = availableBlocks.filter((b) => selectedBlockIds.includes(b.id));
    if (activeBlocks.length === 0) return "";
    return activeBlocks.map((b) => `[Context Memory: ${b.name}]\n${b.content}`).join("\n\n");
  };

  const getCombinedPromptWithContext = () => {
    const contextPrefix = getContextPrefix();
    if (!contextPrefix) return prompt;
    return `${contextPrefix}\n\n[User Prompt]:\n${prompt}`;
  };

  // Saved defaults and custom context blocks also come from storage, so they load
  // after mount. Declared before the draft effect so an in-progress draft still wins.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("pp_prefs");
        const prefs = raw ? JSON.parse(raw) : {};
        if (MODELS.some((m) => m.id === prefs.defaultModel)) setSelectedModel(prefs.defaultModel);
        if (!(handoffTone && tones.includes(handoffTone)) && prefs.defaultTone) setSelectedTone(prefs.defaultTone);
      } catch {
        // Unreadable preferences just leave the defaults in place.
      }
      setAvailableBlocks(getSavedContextBlocks());
    });
  }, [handoffTone]);

  // Restore the in-progress draft so navigating away (or a sign-in round trip) does
  // not lose what the user typed. A handoff prompt/ID always wins over the draft.
  // Deferred past hydration so the server-rendered editor is not clobbered mid-hydrate.
  useEffect(() => {
    if (handoffPrompt || handoffPromptId) return;
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (typeof draft.text === "string") setPrompt(draft.text);
        if (typeof draft.tone === "string" && tones.includes(draft.tone)) setSelectedTone(draft.tone);
        if (typeof draft.length === "string") setSelectedLength(draft.length);
        if (typeof draft.category === "string") setSelectedCategory(draft.category);
        if (draft.level === "quick" || draft.level === "deep" || draft.level === "expert") setEnhanceLevel(draft.level);
        if (typeof draft.model === "string" && MODELS.some((m) => m.id === draft.model)) setSelectedModel(draft.model);
        if (Array.isArray(draft.blockIds)) setSelectedBlockIds(draft.blockIds);
        setDraftSaved(true);
      } catch {
        // A corrupt or blocked draft must never break the editor.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [handoffPrompt, handoffPromptId]);

  // Persist the draft, and only report "Saved" once the write actually succeeds.
  useEffect(() => {
    if (!prompt.trim()) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            text: prompt,
            tone: selectedTone,
            length: selectedLength,
            category: selectedCategory,
            level: enhanceLevel,
            model: selectedModel,
            blockIds: selectedBlockIds,
          })
        );
        setDraftSaved(true);
      } catch {
        setDraftSaved(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [prompt, selectedTone, selectedLength, selectedCategory, enhanceLevel, selectedModel, selectedBlockIds]);

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
    setResult(null);

    const fullPrompt = getCombinedPromptWithContext();

    let userApiKey: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("promptplus_user_apikeys");
        if (raw) {
          const localMap = JSON.parse(raw);
          const targetProv = selectedModelData?.provider || "openai";
          userApiKey = localMap[targetProv];
        }
      } catch {
        // ignore
      }
    }

    try {
      let finalEnhancedText: string | undefined;
      let enhanceProvider = "engine";
      let v2Data: EnhancedResult["v2"] | undefined;
      const response = await fetch("/api/v2/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ text: fullPrompt, mode: "auto", provider: selectedModelData?.provider,
          userApiKey, tone: selectedTone, length: selectedLength, category: selectedCategory,
          level: enhanceLevel, targetModel: selectedModelData?.rawModel || selectedModel }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Enhancement failed. Please try again.");
      if (json.data?.selectedCandidate?.renderedText) {
        enhanceProvider = json.data.source === "llm" ? "api" : "engine";
        finalEnhancedText = json.data.selectedCandidate.renderedText;
        v2Data = json.data;
      }

      if (!finalEnhancedText) {
        setErrorNotice("No enhancement returned. Please try again.");
        return;
      }

      let promptId: string | undefined;
      let savedToLibrary = false;
      // Save the actual pair before requesting a server-owned assessment.
      try {
        const createRes = await fetch("/api/v1/prompts", {
          method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ originalText: fullPrompt,
            model: json.data.model || (enhanceProvider === "engine" ? "promptplus-engine" : selectedModelData?.rawModel || selectedModel),
            category: selectedCategory || null, tone: selectedTone || null, length: selectedLength || null }),
        });
        const created = await createRes.json();
        if (!createRes.ok || !created.data?.id) throw new Error("Save failed");
        const saved = await fetch(`/api/v1/prompts/${created.data.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ enhancedText: finalEnhancedText }),
        });
        if (!saved.ok) throw new Error("Save failed");
        promptId = created.data.id;
        savedToLibrary = true;
      } catch {
        setErrorNotice("Your result is ready, but could not be saved to your account. Copy it before leaving.");
      }

      let originalScore: number | null = null;
      let enhancedScore: number | null = null;
      let dimensions: EnhancedResult["dimensions"];
      if (enhanceProvider === "api" && promptId) {
        try {
          const response = await fetch("/api/v1/prompts/score", {
            method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
            body: JSON.stringify({ promptId, text: finalEnhancedText }),
          });
          const json = await response.json();
          if (response.ok && json.data?.source === "llm") {
            originalScore = isScore(json.data.originalTotal) ? json.data.originalTotal : null;
            enhancedScore = isScore(json.data.total) ? json.data.total : null;
            dimensions = json.data.dimensions;
          }
        } catch { /* Enhancement remains usable when assessment is unavailable. */ }
      }
      setResult({ promptId, source: enhanceProvider, model: json.data.model, saved: savedToLibrary, dimensions,
        original: { text: fullPrompt, score: originalScore },
        enhanced: { text: finalEnhancedText, score: enhancedScore }, v2: v2Data });
      setResultView("output");
      setAnnouncement(enhanceProvider === "engine" ? "Enhanced prompt ready. The built-in engine created it; no model ran." : "Enhanced prompt ready.");
      toast(enhanceProvider === "engine" ? "Deterministic enhancement ready. No model ran." : "Enhanced prompt ready.", "success");
      try {
        const existing = JSON.parse(localStorage.getItem("pp_local_history") || "[]");
        const entry = { id: promptId || `local_${Date.now()}`, originalText: fullPrompt,
          enhancedText: finalEnhancedText, model: json.data.model || (enhanceProvider === "engine" ? "promptplus-engine" : selectedModelData?.name || selectedModel),
          originalScore, enhancedScore, measuredBy: enhancedScore === null ? null : "llm", timestamp: new Date().toISOString() };
        localStorage.setItem("pp_local_history", JSON.stringify([entry, ...existing.filter((x: { originalText: string }) => x.originalText !== fullPrompt)].slice(0, 100)));
      } catch { /* Browser storage may be disabled. */ }
    } catch (error) {
      console.error("Enhancement failed:", error);
      setErrorNotice(error instanceof Error ? error.message : "Enhancement failed. Please try again.");
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

  // A manual edit invalidates anything measured or saved against the old text.
  const handleOutputChange = (text: string) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            saved: false,
            dimensions: undefined,
            enhanced: { text, score: null },
          }
        : null
    );
  };

  const handleRestoreOriginal = () => {
    if (!result) return;
    setPrompt(result.original.text);
    toast("Restored the original prompt into the editor.", "info");
  };

  const jumpToResult = () => {
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ block: "start" });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = resultTabs.findIndex((tab) => tab.id === resultView);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
        ? resultTabs.length - 1
        : event.key === "ArrowRight"
        ? (current + 1) % resultTabs.length
        : (current - 1 + resultTabs.length) % resultTabs.length;
    setResultView(resultTabs[next].id);
  };

  const handleReset = () => {
    setPrompt("");
    setResult(null);
    setSelectedTone("");
    setSelectedLength("");
    setSelectedCategory("");
    setResultView("output");
    setDraftSaved(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Browser storage may be disabled.
    }
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

    // Initialize Speech Recognition with continuous interim dictation
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
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setErrorNotice("Microphone permission was denied. Click the lock or settings icon in your address bar to enable microphone access.");
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

  const sourceLabel =
    result?.source === "api"
      ? "Cloud model enhancement"
      : result?.source === "device"
      ? "On-device model (Gemini Nano)"
      : "Deterministic engine · no model ran";

  return (
    <div className="space-y-6">
      <p aria-live="polite" className="sr-only">{announcement}</p>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-sm">Prompt Builder</h2>
          <p className="text-xs text-muted-foreground">Turn a rough request into a structured prompt you can reuse.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Free — no API key required
        </span>
      </div>

      {errorNotice && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <span role="alert">⚠️ {errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input region */}
        <div className="space-y-6">
          {/* Editor — first thing in the workspace. */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="studio-prompt" className="text-sm font-medium">
                What do you want the AI to do?
              </label>
              <div className="flex items-center gap-3">
                {draftSaved && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3" /> Draft saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  aria-pressed={isListening}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-all ${
                    isListening
                      ? "border-red-500/50 bg-red-500/10 font-semibold text-red-600 dark:text-red-400"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3 w-3" />
                      <span>Stop listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      <span>Voice input</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              id="studio-prompt"
              value={prompt}
              disabled={isEnhancing}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the task, the audience, and anything the answer must include."
              className="h-44 w-full resize-none rounded-xl border border-border bg-background p-3.5 font-mono text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Zap className="h-3.5 w-3.5" /> ~{estimatedTokens} tokens
                </span>
                <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
                <span>{prompt.length} chars</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-expanded={showCostBreakdown}
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Calculator className="h-3 w-3" /> Cost estimates
                </button>
                <button
                  type="button"
                  disabled={isEnhancing}
                  onClick={handleReset}
                  className="flex items-center gap-1 hover:text-foreground hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>

            {showCostBreakdown && (
              <div className="space-y-1.5 border-t border-border/50 pt-2 text-[11px]">
                <p className="text-xs text-muted-foreground">
                  Verify pricing with your provider before running paid requests. Unverified prices are not quoted here.
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {costEstimates.map((c) => (
                    <div key={c.modelId} className="flex items-center justify-between rounded-lg border border-border/60 bg-accent/40 p-2">
                      <span className="mr-1 truncate font-medium">{c.modelName}</span>
                      <span className="font-semibold text-foreground">{c.formattedCost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected context: removable items plus a preview of exactly what is sent. */}
          <ContextMemoryPanel
            availableBlocks={availableBlocks}
            selectedBlockIds={selectedBlockIds}
            onToggleBlock={toggleContextBlock}
            contextPrefix={getContextPrefix()}
            onAddBlock={(block) => {
              setAvailableBlocks((prev) => [...prev, block]);
              setSelectedBlockIds((prev) => [...prev, block.id]);
            }}
            onDeleteBlock={(id) => {
              setAvailableBlocks((prev) => prev.filter((b) => b.id !== id));
              setSelectedBlockIds((prev) => prev.filter((bId) => bId !== id));
            }}
          />

          {/* Optional controls — always below the editor, never before it. */}
          <div className="space-y-4 border-t border-border/60 pt-5">
            <p className="text-xs font-medium text-muted-foreground">Options — optional</p>

            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              savedKeys={savedKeys}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="studio-tone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Tone
                </label>
                <select
                  id="studio-tone"
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-ring"
                >
                  <option value="">Any</option>
                  {tones.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="studio-length" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Length
                </label>
                <select
                  id="studio-length"
                  value={selectedLength}
                  onChange={(e) => setSelectedLength(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-ring"
                >
                  <option value="">Any</option>
                  {lengths.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="studio-category" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  id="studio-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-ring"
                >
                  <option value="">Auto</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div role="group" aria-label="Enhancement level" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Enhancement level</span>
                <span className="text-[11px] text-muted-foreground">
                  {enhanceLevels.find((l) => l.id === enhanceLevel)?.hint}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {enhanceLevels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={enhanceLevel === l.id}
                    onClick={() => setEnhanceLevel(l.id)}
                    className={`h-8 rounded-full border text-xs font-medium transition-all active:scale-95 ${
                      enhanceLevel === l.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isEnhancing ? "Enhancing…" : "Enhance prompt"}
          </button>

          {result && !isEnhancing && (
            <button
              type="button"
              onClick={jumpToResult}
              className="h-10 w-full rounded-xl border border-border text-sm font-medium hover:bg-accent lg:hidden"
            >
              View result
            </button>
          )}
        </div>

        {/* Result region */}
        <section ref={resultRef} tabIndex={-1} aria-label="Result" className="space-y-4 outline-none">
          {!result && !isEnhancing && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center sm:p-8">
              <h3 className="text-sm font-medium">Your enhanced prompt will appear here</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Use <span className="font-medium text-foreground">Output</span> for the finished prompt — editable and
                ready to copy. Use <span className="font-medium text-foreground">Changes</span> for a word-by-word
                comparison with your original. Nothing is scored until you run a check.
              </p>
            </div>
          )}

          {isEnhancing && (
            <div className="rounded-xl border border-border p-6 text-center sm:p-8">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
              <h3 className="text-sm font-medium">Enhancing your prompt…</h3>
              <p className="mt-1 text-xs text-muted-foreground">Preserving your intent and refining the structure</p>
            </div>
          )}

          {result && !isEnhancing && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{sourceLabel}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {result.model && <p className="text-xs text-muted-foreground">{result.model}</p>}
                  {result.saved && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3 w-3" /> Saved to your library
                    </p>
                  )}
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Result view"
                onKeyDown={handleTabKeyDown}
                className="inline-flex rounded-lg border border-border p-0.5"
              >
                {resultTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`result-tab-${tab.id}`}
                    aria-selected={resultView === tab.id}
                    aria-controls={`result-panel-${tab.id}`}
                    tabIndex={resultView === tab.id ? 0 : -1}
                    onClick={() => setResultView(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      resultView === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {resultView === "output" && (
                <div
                  role="tabpanel"
                  id="result-panel-output"
                  aria-labelledby="result-tab-output"
                  className="space-y-2"
                >
                  <label htmlFor="studio-output" className="sr-only">Enhanced prompt</label>
                  <textarea
                    id="studio-output"
                    value={result.enhanced.text}
                    onChange={(e) => handleOutputChange(e.target.value)}
                    className="h-[320px] w-full resize-y rounded-xl border border-border bg-background/90 p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              )}

              {resultView === "changes" && (
                <div
                  role="tabpanel"
                  id="result-panel-changes"
                  aria-labelledby="result-tab-changes"
                  className="space-y-3"
                >
                  <PromptDiff before={result.original.text} after={result.enhanced.text} />
                  <button
                    type="button"
                    onClick={handleRestoreOriginal}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent active:scale-[0.98]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore original into editor
                  </button>
                </div>
              )}

              {/* Primary actions, always in reach of the result. */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy prompt"}
                </button>
                <button
                  type="button"
                  onClick={handleRefine}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-all hover:bg-accent active:scale-[0.98]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Refine
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium outline-none transition-all hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent active:scale-[0.98]">
                    More actions <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Open in</DropdownMenuLabel>
                    {(
                      [
                        ["chatgpt", "ChatGPT"],
                        ["claude", "Claude"],
                        ["gemini", "Gemini"],
                      ] as const
                    ).map(([target, label]) => (
                      <DropdownMenuItem key={target} onClick={() => openInTarget(target)} className="gap-2">
                        <ExternalLink className="h-3.5 w-3.5" /> {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowExportModal(true)} className="gap-2">
                      <Code className="h-3.5 w-3.5" /> Export as code
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Developer details stay collapsed by default. */}
              <details className="rounded-xl border border-border">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Developer details</summary>
                <div className="space-y-4 border-t border-border px-4 py-4">
                  {result.v2 && (
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium text-primary">
                          <Target className="h-3.5 w-3.5" />
                          <span className="font-mono text-xs">
                            Domain: <strong className="capitalize text-foreground">{result.v2.intent.domain || "General"}</strong>
                          </span>
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-medium capitalize text-primary">
                            {result.v2.intent.taskType} · {result.v2.intent.complexity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <Shield className={`h-3.5 w-3.5 ${result.v2.security.isSafe ? "text-emerald-500" : "text-amber-500"}`} />
                          <span className={result.v2.security.isSafe ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-amber-600"}>
                            {result.v2.security.isSafe ? "Security scan passed" : "Security alert"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Only show assessments that actually ran. */}
                  {(result.v2?.selectedCandidate?.hybridScore || result.enhanced.score !== null) && (
                    <ScoreBreakdown
                      originalScore={result.original.score}
                      enhancedScore={result.enhanced.score}
                      dimensions={result.dimensions}
                      v2HybridScore={result.v2?.selectedCandidate?.hybridScore}
                    />
                  )}

                  {result.v2?.loopTrace && <LoopTraceCard loopTrace={result.v2.loopTrace} />}

                  {result.v2 && result.v2.candidates.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-muted-foreground">Candidate strategy</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {result.v2.candidates.map((cand) => {
                          const isSelected = result.enhanced.text === cand.renderedText;
                          return (
                            <button
                              key={cand.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                setResult((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        promptId: undefined,
                                        saved: false,
                                        source: "engine",
                                        dimensions: undefined,
                                        original: { ...prev.original, score: null },
                                        enhanced: {
                                          text: cand.renderedText,
                                          score: null,
                                        },
                                      }
                                    : null
                                );
                              }}
                              className={`rounded-xl border p-2.5 text-left transition-all active:scale-95 ${
                                isSelected
                                  ? "border-primary bg-primary/10 font-semibold text-foreground"
                                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                              }`}
                            >
                              <p className="truncate text-[11px] font-medium">{cand.name}</p>
                              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{cand.estimatedTokens} tokens</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <LiveEvaluation
                    key={result.enhanced.text}
                    originalPrompt={result.original.text}
                    candidateText={result.enhanced.text}
                    promptId={result.promptId}
                    targetModel={selectedModelData?.rawModel || selectedModel}
                  />
                </div>
              </details>
            </>
          )}
        </section>
      </div>

      {result && (
        <ExportCodeModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Enhanced Prompt"
          promptText={result.enhanced.text}
        />
      )}
    </div>
  );
}

export default function PromptBuilderRoute() {
  return (
    <Suspense fallback={null}>
      <PromptBuilderPage />
    </Suspense>
  );
}
