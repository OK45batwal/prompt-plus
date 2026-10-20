"use client";

import { useState } from "react";
import { Brain, PlusCircle, Trash2, X } from "lucide-react";
import { ContextBlock, saveCustomContextBlock } from "@/lib/context-memory";

interface ContextMemoryPanelProps {
  /** Which account owns any context saved from this panel. */
  accountId?: string | null;
  availableBlocks: ContextBlock[];
  selectedBlockIds: string[];
  onToggleBlock: (id: string) => void;
  onAddBlock: (block: ContextBlock) => void;
  onDeleteBlock?: (id: string) => void;
  /** The exact text that gets prepended to the prompt, in order. */
  contextPrefix: string;
}

export function ContextMemoryPanel({
  accountId,
  availableBlocks,
  selectedBlockIds,
  onToggleBlock,
  onAddBlock,
  onDeleteBlock,
  contextPrefix,
}: ContextMemoryPanelProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [newContextName, setNewContextName] = useState("");
  const [newContextContent, setNewContextContent] = useState("");

  const selected = availableBlocks.filter((b) => selectedBlockIds.includes(b.id));
  const unselected = availableBlocks.filter((b) => !selectedBlockIds.includes(b.id));

  const handleSave = () => {
    const name = newContextName.trim();
    const content = newContextContent.trim();
    if (!name || !content) return;
    const block = saveCustomContextBlock({ name, description: "Custom saved context", category: "custom", content }, accountId);
    onAddBlock(block);
    setNewContextName("");
    setNewContextContent("");
    setShowPicker(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" /> Context
        </span>
        <button
          type="button"
          aria-expanded={showPicker}
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showPicker ? "Done" : "+ Add context"}
        </button>
      </div>

      {selected.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nothing added. Your prompt is sent exactly as you wrote it.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((block) => (
            <li key={block.id}>
              <button
                type="button"
                onClick={() => onToggleBlock(block.id)}
                aria-label={`Remove ${block.name} from the context`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {block.name}
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <details className="rounded-lg border border-border/70">
          <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
            Preview what will be included
          </summary>
          <pre className="max-h-48 overflow-y-auto border-t border-border/70 px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words">
            {contextPrefix}
          </pre>
        </details>
      )}

      {showPicker && (
        <div className="space-y-3 rounded-lg border border-border/70 p-3">
          {unselected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {unselected.map((block) => (
                <div key={block.id} className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onToggleBlock(block.id)}
                    aria-label={`Add ${block.name} to the context`}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <PlusCircle className="h-3 w-3 opacity-70" />
                    {block.name}
                  </button>
                  {block.category === "custom" && onDeleteBlock && (
                    <button
                      type="button"
                      onClick={() => onDeleteBlock(block.id)}
                      aria-label={`Delete ${block.name}`}
                      className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 border-t border-border/60 pt-3">
            <input
              value={newContextName}
              onChange={(e) => setNewContextName(e.target.value)}
              aria-label="New context name"
              placeholder="Context name (e.g. My SaaS brand voice)"
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-ring"
            />
            <textarea
              value={newContextContent}
              onChange={(e) => setNewContextContent(e.target.value)}
              aria-label="New context content"
              placeholder="Context to include with every enhancement (audience, brand guidelines, persona...)"
              className="h-16 w-full resize-none rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-ring"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!newContextName.trim() || !newContextContent.trim()}
                className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                Save & include
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
