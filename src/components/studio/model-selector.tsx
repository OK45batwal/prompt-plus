"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { MODELS, getModelById, ModelDefinition } from "@/lib/models";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
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
      <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Automatic enhancement</p>
        <p className="mt-1">Uses a cloud model when a matching key is available. Otherwise, the deterministic engine is included — no API key required.</p>
        {!savedKeys[selectedModelData?.provider || "openai"] && <Link href="/dashboard/settings" className="mt-2 inline-block underline">Connect an API key</Link>}
      </div>
      {/* Cloud model preference, used when credentials resolve. */}
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
                  <span className="text-[10px] opacity-75">Needs OpenRouter key</span>
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
    </div>
  );
}
