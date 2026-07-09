"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Copy, Check, ArrowRight } from "lucide-react";

interface ComparisonItem {
  id: string;
  text: string;
  score: number;
}

export default function ComparePage() {
  const [items, setItems] = useState<ComparisonItem[]>([
    { id: "1", text: "", score: 0 },
    { id: "2", text: "", score: 0 },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addItem = () => {
    if (items.length >= 4) return;
    setItems([...items, { id: `new-${Date.now()}`, text: "", score: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, text: string) => {
    setItems(items.map((item) => {
      if (item.id === id) {
        // Simple scoring based on length and keywords
        let score = 50;
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const lowerText = text.toLowerCase();

        if (wordCount > 10) score += 10;
        if (wordCount > 30) score += 10;
        if (wordCount > 50) score += 5;

        if (lowerText.includes("specific") || lowerText.includes("exactly")) score += 10;
        if (/\d/.test(text)) score += 5;
        if (lowerText.includes("example")) score += 5;
        if (lowerText.includes("step")) score += 5;
        if (lowerText.includes("list")) score += 5;

        return { ...item, text, score: Math.min(100, score) };
      }
      return item;
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const bestItem = items.reduce((best, item) =>
    item.score > best.score ? item : best
  , items[0]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Compare Prompts</h1>
            <p className="text-xs text-muted-foreground">Side-by-side comparison</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Comparison Grid */}
        <div className={`grid gap-4 ${items.length === 2 ? "grid-cols-1 md:grid-cols-2" : items.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Prompt {index + 1}</span>
                  {item.score > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      item.score >= 80 ? "bg-green-100 text-green-700" :
                      item.score >= 60 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {item.score}/100
                    </span>
                  )}
                  {item.id === bestItem.id && item.score > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background">BEST</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {item.text && (
                    <button
                      onClick={() => copyToClipboard(item.text, item.id)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  )}
                  {items.length > 2 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-accent rounded text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                placeholder={`Enter prompt ${index + 1}...`}
                className="w-full h-64 p-3 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground"
              />
              {item.text && (
                <div className="px-3 pb-3">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 80 ? "bg-green-500" :
                        item.score >= 60 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Button */}
          {items.length < 4 && (
            <button
              onClick={addItem}
              className="rounded-lg border border-dashed hover:border-foreground/30 transition-colors flex flex-col items-center justify-center min-h-[300px] text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-sm">Add Prompt</span>
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-lg border bg-card">
          <h3 className="font-medium text-sm mb-2">How to compare</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Enter different versions of your prompt in each column</li>
            <li>• Watch the real-time score update as you type</li>
            <li>• The &quot;BEST&quot; badge highlights the highest-scoring prompt</li>
            <li>• Copy the winning prompt with one click</li>
            <li>• Add up to 4 prompts for comparison</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
