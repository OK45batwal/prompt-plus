"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Clock, RotateCcw, Trash2, ChevronDown, Check } from "lucide-react";

interface HistoryItem {
  id: string;
  originalText: string;
  enhancedText: string;
  model: string;
  originalScore: number;
  enhancedScore: number;
  timestamp: string;
}

const mockHistory: HistoryItem[] = [
  {
    id: "1",
    originalText: "Write a blog post about AI",
    enhancedText: "Act as a professional content writer. Write a comprehensive blog post about artificial intelligence in 2024...",
    model: "gpt-4",
    originalScore: 45,
    enhancedScore: 85,
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    originalText: "Help me with my resume",
    enhancedText: "Act as a professional career coach. Review and enhance my resume for [TARGET_POSITION]...",
    model: "claude-3",
    originalScore: 32,
    enhancedScore: 78,
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    originalText: "Create a marketing email",
    enhancedText: "Act as a marketing specialist. Create a compelling email campaign for [PRODUCT]...",
    model: "gpt-4",
    originalScore: 55,
    enhancedScore: 92,
    timestamp: "1 day ago",
  },
  {
    id: "4",
    originalText: "Explain quantum computing",
    enhancedText: "Act as a physics professor. Explain quantum computing concepts in simple terms...",
    model: "gemini-pro",
    originalScore: 60,
    enhancedScore: 88,
    timestamp: "2 days ago",
  },
];

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState(mockHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = history.filter((item) =>
    item.originalText.toLowerCase().includes(search.toLowerCase()) ||
    item.enhancedText.toLowerCase().includes(search.toLowerCase())
  );

  const deleteHistory = (id: string) => {
    setHistory(history.filter((item) => item.id !== id));
  };

  const router = useRouter();

  const reusePrompt = (item: HistoryItem) => {
    // Navigate to builder with this prompt
    router.push(`/dashboard/new?prompt=${encodeURIComponent(item.originalText)}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-sm">History</h2>
        <p className="text-xs text-muted-foreground">{history.length} items</p>
      </div>

      <div className="max-w-4xl">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No history found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Main Row */}
                <div
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.originalText}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted">{item.model}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Before</p>
                      <p className="text-sm font-bold text-red-600">{item.originalScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">After</p>
                      <p className="text-sm font-bold text-green-600">{item.enhancedScore}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === item.id ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="border-t p-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Original</p>
                      <p className="text-sm p-2 rounded bg-muted/50">{item.originalText}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Enhanced</p>
                      <p className="text-sm p-2 rounded bg-muted/50">{item.enhancedText}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reusePrompt(item)}
                        className="h-8 flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reuse
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.enhancedText)}
                        className="h-8 flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Copy Enhanced
                      </button>
                      <button
                        onClick={() => deleteHistory(item.id)}
                        className="h-8 flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors text-red-600 ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
