"use client";

import { useState } from "react";
import { Brain, Check, PlusCircle, Trash2 } from "lucide-react";
import { ContextBlock, saveCustomContextBlock } from "@/lib/context-memory";

interface ContextMemoryPanelProps {
  availableBlocks: ContextBlock[];
  selectedBlockIds: string[];
  onToggleBlock: (id: string) => void;
  onAddBlock: (block: ContextBlock) => void;
  onDeleteBlock?: (id: string) => void;
}

export function ContextMemoryPanel({
  availableBlocks,
  selectedBlockIds,
  onToggleBlock,
  onAddBlock,
  onDeleteBlock,
}: ContextMemoryPanelProps) {
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContextName, setNewContextName] = useState("");
  const [newContextContent, setNewContextContent] = useState("");

  const handleSave = () => {
    const name = newContextName.trim();
    const content = newContextContent.trim();
    if (!name || !content) return;
    const block = saveCustomContextBlock({ name, description: "Custom saved context", category: "custom", content });
    onAddBlock(block);
    setNewContextName("");
    setNewContextContent("");
    setShowAddContext(false);
  };

  return (
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
          const isCustom = block.category === "custom";

          return (
            <div key={block.id} className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onToggleBlock(block.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {isActive ? <Check className="h-3 w-3" /> : <PlusCircle className="h-3 w-3 opacity-60" />}
                {block.name}
              </button>
              {isCustom && onDeleteBlock && (
                <button
                  type="button"
                  onClick={() => onDeleteBlock(block.id)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remove context block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
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
            placeholder="Context to auto-include in every enhancement (audience, brand guidelines, persona...)"
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
              onClick={handleSave}
              disabled={!newContextName.trim() || !newContextContent.trim()}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              Save & Activate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
