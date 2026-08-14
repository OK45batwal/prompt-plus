"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Brain, ChevronDown } from "lucide-react";
import { MODELS, getModelById, ModelDefinition } from "@/lib/models";
import { isDeviceAISupported, checkDeviceAvailability } from "@/lib/llm/device-ai";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  enhanceMode: "api" | "device";
  onSetEnhanceMode: (mode: "api" | "device") => void;
  deviceState: "unknown" | "available" | "unavailable" | "downloading";
  onSetDeviceState: (state: "unknown" | "available" | "unavailable" | "downloading") => void;
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  enhanceMode,
  onSetEnhanceMode,
  deviceState,
  onSetDeviceState,
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
      {/* Engine Mode Switcher */}
      <div className="p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">Enhancement Engine</span>
          <span className="text-[10px] text-muted-foreground">
            {enhanceMode === "api" ? "🟢 Cloud AI — 100% free out-of-the-box" : "⚡ On-device — private, offline, free"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetEnhanceMode("api")}
            className={`h-9 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              enhanceMode === "api"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> API Based
          </button>
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
            className={`h-9 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              enhanceMode === "device"
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
              onClick={() => onSetEnhanceMode("api")}
              className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Zap className="h-3 w-3" /> Switch to API Mode
            </button>
          </div>
        )}
      </div>

      {/* Target Model Dropdown */}
      {enhanceMode === "api" && (
        <div className="relative" ref={dropdownRef}>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Model</label>
          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="w-full h-10 flex items-center justify-between px-3 rounded-lg border bg-background text-sm hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>{selectedModelData?.icon}</span>
              <span>{selectedModelData?.name}</span>
              {selectedModelData?.free && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  FREE
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {showModelDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto scrollbar-thin">
              {MODELS.map((model: ModelDefinition) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setShowModelDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="shrink-0">{model.icon}</span>
                  <span className="truncate">{model.name}</span>
                  {model.free && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ml-auto shrink-0">
                      FREE
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
