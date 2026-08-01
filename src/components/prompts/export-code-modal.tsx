"use client";

import { useState } from "react";
import { Copy, Check, Code, X, Play, Sliders } from "lucide-react";
import { extractVariables, substituteVariables, generateCodeSnippet, ExportFormat } from "@/lib/prompt-variables";

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  promptText: string;
}

export function ExportCodeModal({ isOpen, onClose, title, promptText }: ExportCodeModalProps) {
  const [activeTab, setActiveTab] = useState<ExportFormat>("python");
  const [copied, setCopied] = useState(false);

  const variables = extractVariables(promptText);
  const [varValues, setVarValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variables.forEach((v) => {
      initial[v.name] = "";
    });
    return initial;
  });

  if (!isOpen) return null;

  const filledPrompt = substituteVariables(promptText, varValues);
  const codeSnippet = generateCodeSnippet(filledPrompt, activeTab);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Export Code & Variables — {title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Variable Fill Form (if variables detected) */}
        {variables.length > 0 && (
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sliders className="h-3.5 w-3.5" />
              <span>Prompt Variables Detected ({variables.length}) — Fill values below:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variables.map((v) => (
                <div key={v.name} className="space-y-1">
                  <label className="text-[11px] font-mono text-muted-foreground block">
                    {`{{${v.name}}}`}
                  </label>
                  <input
                    type="text"
                    value={varValues[v.name] || ""}
                    onChange={(e) => setVarValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
                    placeholder={`Enter ${v.placeholder}…`}
                    className="w-full h-8 px-3 rounded-lg border bg-background text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code Language Format Tabs */}
        <div className="flex items-center gap-1 border-b pb-2">
          {(["python", "nodejs", "langchain", "curl"] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setActiveTab(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                activeTab === fmt
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {fmt === "nodejs" ? "Node.js" : fmt === "curl" ? "cURL" : fmt}
            </button>
          ))}
        </div>

        {/* Snippet Code Box */}
        <div className="relative rounded-xl border bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
          <button
            onClick={() => handleCopy(codeSnippet)}
            className="absolute top-3 right-3 h-8 px-2.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-sans text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Code"}
          </button>
          <pre className="pr-20 leading-relaxed whitespace-pre">{codeSnippet}</pre>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>Variables filled automatically into prompt string.</span>
          <button
            onClick={() => handleCopy(filledPrompt)}
            className="h-8 px-3 rounded-lg bg-foreground text-background font-semibold hover:bg-foreground/90 flex items-center gap-1.5 transition-colors"
          >
            <Play className="h-3 w-3" /> Copy Substituted Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
