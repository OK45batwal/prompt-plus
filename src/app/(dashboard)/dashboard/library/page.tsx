"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Clock, Star, Copy, Trash2, MoreHorizontal, Filter, Grid, List } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  originalText: string;
  enhancedText?: string;
  model: string;
  category: string;
  score: number;
  isFavorite: boolean;
  createdAt: string;
}

const mockPrompts: Prompt[] = [
  {
    id: "1",
    title: "Blog Post Intro",
    originalText: "Write an introduction for a blog post about AI",
    enhancedText: "Act as a professional content writer. Write an engaging introduction for a blog post about artificial intelligence in 2024. Target audience: tech enthusiasts and business professionals. Tone: Professional yet accessible. Include a hook, context, and preview of what the article will cover.",
    model: "gpt-4",
    category: "Blog Post",
    score: 85,
    isFavorite: true,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Email Follow-up",
    originalText: "Follow up on the meeting",
    enhancedText: "Act as a professional email specialist. Write a follow-up email after a business meeting. Sender: [Your Company]. Recipient: [Client/Colleague]. Goal: Reinforce key points, confirm action items, and maintain professional relationship. Include: Thank you, summary of decisions, next steps, and warm closing.",
    model: "claude-3",
    category: "Email",
    score: 78,
    isFavorite: false,
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    title: "Code Review Request",
    originalText: "Review my React component",
    enhancedText: "Act as a senior React developer. Review the following React component for: code quality, performance, security, accessibility, and best practices. Provide specific improvement suggestions with code examples. Component: [PASTE CODE]. Focus on: 1) Component structure 2) State management 3) Performance optimization 4) Security concerns.",
    model: "gpt-4",
    category: "Code",
    score: 92,
    isFavorite: true,
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    title: "Social Media Post",
    originalText: "Promote my new product",
    enhancedText: "Act as a social media marketing expert. Create an engaging post for [PLATFORM] promoting [PRODUCT]. Target audience: [AUDIENCE]. Brand voice: [TONE]. Goal: Drive engagement and conversions. Include: Attention-grabbing hook, key benefits, relevant hashtags, clear call-to-action, and emoji usage.",
    model: "gemini-pro",
    category: "Social Media",
    score: 74,
    isFavorite: false,
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    title: "Technical Tutorial",
    originalText: "Explain how to use Docker",
    enhancedText: "Act as a DevOps instructor. Write a comprehensive tutorial on Docker for intermediate developers. Cover: 1) What is Docker and why use it 2) Installation and setup 3) Basic commands with examples 4) Creating Dockerfiles 5) Docker Compose 6) Best practices. Include code examples and real-world scenarios.",
    model: "claude-3",
    category: "Tutorial",
    score: 88,
    isFavorite: false,
    createdAt: "2024-01-11",
  },
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("all");
  const [prompts, setPrompts] = useState(mockPrompts);

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.originalText.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    setPrompts(prompts.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter((p) => p.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const categories = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Documentation", "Marketing"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Prompt Library</h1>
            <p className="text-xs text-muted-foreground">{prompts.length} prompts saved</p>
          </div>
        </div>
        <Link
          href="/dashboard/new"
          className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New Prompt
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-accent" : ""}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-accent" : ""}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Prompts Grid/List */}
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No prompts found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm">{prompt.title}</h3>
                  <button
                    onClick={() => toggleFavorite(prompt.id)}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <Star className={`h-4 w-4 ${prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{prompt.originalText}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="px-1.5 py-0.5 rounded bg-muted">{prompt.model}</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted">{prompt.category}</span>
                  <span className="ml-auto font-medium">{prompt.score}/100</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(prompt.enhancedText || prompt.originalText)}
                    className="h-7 flex items-center justify-center rounded border px-2 text-xs hover:bg-accent transition-colors"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="h-7 flex items-center justify-center rounded border px-2 text-xs hover:bg-accent transition-colors text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="p-3 rounded-lg border bg-card hover:border-foreground/20 transition-colors flex items-center gap-4">
                <button
                  onClick={() => toggleFavorite(prompt.id)}
                  className="p-1 hover:bg-accent rounded shrink-0"
                >
                  <Star className={`h-4 w-4 ${prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{prompt.title}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-xs">{prompt.model}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-xs">{prompt.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{prompt.originalText}</p>
                </div>
                <span className="text-xs font-medium shrink-0">{prompt.score}/100</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(prompt.enhancedText || prompt.originalText)}
                    className="h-7 flex items-center justify-center rounded border px-2 text-xs hover:bg-accent transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="h-7 flex items-center justify-center rounded border px-2 text-xs hover:bg-accent transition-colors text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
