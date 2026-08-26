"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Brain, Sliders, ChevronDown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { MODELS, getModelById, ModelDefinition } from "@/lib/models";
import { isDeviceAISupported, checkDeviceAvailability } from "@/lib/llm/device-ai";

export type EnhanceEngineMode = "api" | "algorithmic" | "device";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  enhanceMode: EnhanceEngineMode;
  onSetEnhanceMode: (mode: EnhanceEngineMode) => void;
  deviceState: "unknown" | "available" | "unavailable" | "downloading";
  onSetDeviceState: (state: "unknown" | "available" | "unavailable" | "downloading") => void;
  savedKeys?: Record<string, boolean>;
}

function getProviderBadge(provider: ModelDefinition["provider"]) {
  switch (provider) {
    case "openrouter":
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0">
          OpenRouter
        </span>
      );
    case "nvidia":
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
          NVIDIA NIM
        </span>
      );
    case "openai":
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
          OpenAI
        </span>
      );
    case "anthropic":
      return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
          Anthropic
        </span>
      );
  }
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  enhanceMode,
  onSetEnhanceMode,
  deviceState,
  onSetDeviceState,
  savedKeys = {},
}: ModelSelectorProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedModelData = getModelById(selectedModel);

  // Click-outside listener
  useEffect(() => {
    if (!showModelDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelDropdown]);

  return (
    <div className="space-y-3">
      {/* 3-Tier Engine Mode Switcher */}
      <div className="p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">Enhancement Engine</span>
          <span className="text-[10px] text-muted-foreground">
            {enhanceMode === "api"
              ? "🟢 API Cloud AI — Key or free fallback"
              : enhanceMode === "algorithmic"
              ? "⚡ No-API Engine — 100% offline, zero key required"
              : "🧠 On-Device — Private, offline Gemini Nano"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Option 1: API Based */}
          <button
            type="button"
            onClick={() => onSetEnhanceMode("api")}
            className={`h-9 px-2 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              enhanceMode === "api"
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
            title="Uses your API key if provided, or free server tier"
          >
            <Zap className="h-3.5 w-3.5" /> API Based
          </button>

          {/* Option 2: No-API Algorithmic System */}
          <button
            type="button"
            onClick={() => onSetEnhanceMode("algorithmic")}
            className={`h-9 px-2 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              enhanceMode === "algorithmic"
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
            title="100% Offline Rule-Based Compiler — No API key needed"
          >
            <Sliders className="h-3.5 w-3.5" /> No-API Engine
          </button>

          {/* Option 3: On-Device Gemini Nano */}
          <button
            type="button"
            onClick={() => {
              onSetEnhanceMode("device");
              if (isDeviceAISupported()) {
                checkDeviceAvailability().then(onSetDeviceState).catch(() => onSetDeviceState("unavailable"));
              } else {
                onSetDeviceState("unavailable");
              }
            }}
            className={`h-9 px-2 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              enhanceMode === "device"
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
            title="Chrome Gemini Nano Offline Local AI"
          >
            <Brain className="h-3.5 w-3.5" /> On-Device
          </button>
        </div>

        {enhanceMode === "api" && (
          <>
            {!selectedModelData?.free && !savedKeys[selectedModelData?.provider || "openai"] && !savedKeys["openrouter"] ? (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <p className="font-bold text-[12px]">⚠️ API Key Required for {selectedModelData?.name || "Target Model"}</p>
                    <p className="text-[11px] opacity-90">
                      No connected key for <span className="font-semibold uppercase">{selectedModelData?.provider || "OpenAI"}</span>. Add your key in Settings or switch to the 100% Free No-API Engine.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href="/dashboard/settings"
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors"
                  >
                    Add Key
                  </Link>
                  <button
                    type="button"
                    onClick={() => onSetEnhanceMode("algorithmic")}
                    className="px-2.5 py-1 rounded-lg bg-background border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-accent font-semibold text-[11px] transition-colors"
                  >
                    Switch to No-API
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 p-2 rounded-md bg-primary/5 border border-primary/10 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>🔑 Custom API key connected & active in Cloud Vault.</span>
              </div>
            )}
          </>
        )}

        {enhanceMode === "device" && deviceState === "unavailable" && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
            <span>
              On-Device Gemini Nano requires Chrome 138+ with Prompt API enabled (chrome://flags → Enable Prompt API).
            </span>
            <button
              type="button"
              onClick={() => onSetEnhanceMode("api")}
              className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Zap className="h-3 w-3" /> Switch to API Mode
            </button>
          </div>
        )}
      </div>

      {/* Target Model Dropdown (for API mode) */}
      {enhanceMode === "api" && (
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground block">Target AI Model</label>
            {selectedModelData && (
              <div className="flex items-center gap-1.5">
                {getProviderBadge(selectedModelData.provider)}
                {selectedModelData.free && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30">
                    FREE
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="w-full h-11 flex items-center justify-between px-3.5 rounded-xl border bg-background text-sm hover:bg-accent/60 transition-colors shadow-2xs"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">{selectedModelData?.icon}</span>
              <span className="font-medium truncate">{selectedModelData?.name}</span>
              <span className="hidden sm:inline-block">
                {selectedModelData && getProviderBadge(selectedModelData.provider)}
              </span>
              {selectedModelData?.free && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 shrink-0">
                  FREE
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${showModelDropdown ? "rotate-180" : ""}`} />
          </button>

          {showModelDropdown && (
            <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-md border rounded-2xl shadow-xl p-1.5 max-h-80 overflow-y-auto scrollbar-thin space-y-2 animate-in fade-in zoom-in-95">
              {/* OpenRouter Group */}
              <div>
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-between">
                  <span>⚡ OpenRouter Free Models</span>
                  <span className="text-[10px] opacity-75">No Key Required</span>
                </div>
                <div className="space-y-0.5">
                  {MODELS.filter((m) => m.provider === "openrouter").map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                        selectedModel === model.id ? "bg-accent font-semibold text-foreground" : "hover:bg-accent/50 text-foreground/90"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{model.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{model.name}</p>
                          {model.description && <p className="text-[10px] text-muted-foreground truncate">{model.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {getProviderBadge(model.provider)}
                        {model.free && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30">
                            FREE
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NVIDIA NIM Group */}
              <div className="border-t pt-1.5">
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>🟢 NVIDIA NIM Accelerated Models</span>
                  <span className="text-[10px] opacity-75">Free Tier</span>
                </div>
                <div className="space-y-0.5">
                  {MODELS.filter((m) => m.provider === "nvidia").map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                        selectedModel === model.id ? "bg-accent font-semibold text-foreground" : "hover:bg-accent/50 text-foreground/90"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{model.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{model.name}</p>
                          {model.description && <p className="text-[10px] text-muted-foreground truncate">{model.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {getProviderBadge(model.provider)}
                        {model.free && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30">
                            FREE
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* OpenAI & Anthropic Premium Models */}
              <div className="border-t pt-1.5">
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>🔑 OpenAI & Anthropic Models</span>
                  <span className="text-[10px] opacity-75">Custom API Key</span>
                </div>
                <div className="space-y-0.5">
                  {MODELS.filter((m) => m.provider === "openai" || m.provider === "anthropic").map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                        selectedModel === model.id ? "bg-accent font-semibold text-foreground" : "hover:bg-accent/50 text-foreground/90"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{model.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{model.name}</p>
                          {model.description && <p className="text-[10px] text-muted-foreground truncate">{model.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {getProviderBadge(model.provider)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
