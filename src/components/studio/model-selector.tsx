"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { MODELS, getModelById, accessLabel, canIncurProviderCharges, providerLabel, ModelDefinition } from "@/lib/models";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  savedKeys?: Record<string, boolean>;
}

const PROVIDER_BADGE: Record<ModelDefinition["provider"], string> = {
  openrouter: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  nvidia: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  openai: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  anthropic: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  google: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

function getProviderBadge(provider: ModelDefinition["provider"]) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${PROVIDER_BADGE[provider]}`}>
      {providerLabel(provider)}
    </span>
  );
}

function AccessBadge({ model }: { model: ModelDefinition }) {
  const paid = canIncurProviderCharges(model);
  const tone = paid
    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
    : "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${tone}`}>
      {accessLabel(model)}
    </span>
  );
}

function KeyStatus({ provider, savedKeys }: { provider: ModelDefinition["provider"]; savedKeys: Record<string, boolean> }) {
  return savedKeys[provider] ? (
    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">Key saved</span>
  ) : (
    <span className="text-[10px] text-muted-foreground shrink-0">No key</span>
  );
}

const GROUPS: Array<{ title: string; providers: ModelDefinition["provider"][]; hint: string }> = [
  { title: "OpenRouter", providers: ["openrouter"], hint: "Needs an OpenRouter key" },
  { title: "Google Gemini", providers: ["google"], hint: "Free tier depends on your project" },
  { title: "NVIDIA NIM", providers: ["nvidia"], hint: "Developer access" },
  { title: "OpenAI & Anthropic", providers: ["openai", "anthropic"], hint: "Billed by the provider" },
];

export function ModelSelector({
  selectedModel,
  onSelectModel,
  savedKeys = {},
}: ModelSelectorProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [accessFilter, setAccessFilter] = useState<"all" | "free" | "paid">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedModelData = getModelById(selectedModel);
  const selectedProvider = selectedModelData?.provider;
  const selectedHasKey = selectedProvider ? Boolean(savedKeys[selectedProvider]) : false;
  const selectedCanBill = selectedModelData ? canIncurProviderCharges(selectedModelData) : false;

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
        <p className="mt-1">
          A cloud model runs only when this provider has a saved key. Without one, the deterministic engine runs and no model is called.
        </p>
        {selectedProvider && !selectedHasKey && (
          <Link href={`/dashboard/settings?tab=api-keys&provider=${selectedProvider}`} className="mt-2 inline-block underline">
            Connect a {providerLabel(selectedProvider)} key
          </Link>
        )}
        {selectedCanBill && selectedModelData?.pricing.note && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">{selectedModelData.pricing.note}</p>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-muted-foreground block">Target AI Model</label>
          {selectedModelData && (
            <div className="flex items-center gap-1.5">
              {getProviderBadge(selectedModelData.provider)}
              <AccessBadge model={selectedModelData} />
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
            {selectedModelData && <AccessBadge model={selectedModelData} />}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${showModelDropdown ? "rotate-180" : ""}`} />
        </button>

        {showModelDropdown && (
          <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-md border rounded-2xl shadow-xl p-1.5 max-h-80 overflow-y-auto scrollbar-thin space-y-2 animate-in fade-in zoom-in-95">
            <div role="group" aria-label="Filter models by cost" className="flex gap-1 px-1 pt-1 pb-1.5">
              {([["all", "All"], ["free", "Free & free tier"], ["paid", "Paid"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={accessFilter === value}
                  onClick={() => setAccessFilter(value)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                    accessFilter === value ? "bg-foreground text-background" : "hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {GROUPS.map((group, index) => {
              const models = MODELS.filter(
                (m) =>
                  group.providers.includes(m.provider) &&
                  (accessFilter === "all" ||
                    (accessFilter === "free" ? m.access === "free" || m.access === "free_tier_available" : canIncurProviderCharges(m)))
              );
              if (models.length === 0) return null;
              return (
              <div key={group.title} className={index > 0 ? "border-t pt-1.5" : undefined}>
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>{group.title}</span>
                  <span className="text-[10px] opacity-75">{group.hint}</span>
                </div>
                <div className="space-y-0.5">
                  {models.map((model) => (
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
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            {model.description && <span className="truncate">{model.description}</span>}
                            <KeyStatus provider={model.provider} savedKeys={savedKeys} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <AccessBadge model={model} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
