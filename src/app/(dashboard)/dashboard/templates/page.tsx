"use client";

import { useState, useEffect } from "react";
import { Search, Copy, Check, FileText, Mail, Code, Share2, Book, ShoppingBag, BadgeCheck, Terminal, GitFork, Sparkles } from "lucide-react";
import { ExportCodeModal } from "@/components/prompts/export-code-modal";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  model: string | null;
  usageCount: number;
  isOfficial: boolean;
  prompt: string;
}

const STATIC_OFFICIAL_TEMPLATES: TemplateItem[] = [
  {
    id: "tpl_seo_blog",
    title: "High-Converting SEO Blog Article",
    description: "Generates a structured, SEO-optimized blog post with headers, FAQs, and a compelling conclusion.",
    category: "Blog Post",
    model: "gpt-4o-mini",
    usageCount: 1420,
    isOfficial: true,
    prompt: `You are an expert SEO content strategist and copywriter. Create a comprehensive, engaging 1500-word blog article on {{topic}} targeting {{target_audience}}.

Instructions:
1. Include an attention-grabbing hook and thesis statement in the introduction.
2. Structure the article with clear H2 and H3 headings containing relevant keywords.
3. Highlight key takeaways: {{key_takeaways}}.
4. Maintain a {{tone}} tone of voice throughout.
5. End with a summary conclusion and a strong Call to Action (CTA).`,
  },
  {
    id: "tpl_cold_email",
    title: "B2B Cold Sales Email Sequence",
    description: "High-response 3-step cold email sequence tailored to specific buyer personas and pain points.",
    category: "Email",
    model: "claude-3-5-sonnet-20241022",
    usageCount: 980,
    isOfficial: true,
    prompt: `You are a world-class B2B sales copywriter. Write a 3-step cold email sequence introducing {{product_name}} to a {{target_role}}.

Email 1 (Initial Outreach):
- Focus on addressing the pain point: {{pain_point}}.
- Keep under 120 words with a low-friction call to action: {{call_to_action}}.

Email 2 (Value Add Follow-up):
- Share a short case study or metric-backed benefit.

Email 3 (Final Check-in):
- Professional break-up email offering a simple resource.`,
  },
  {
    id: "tpl_nextjs_api",
    title: "Next.js 16 API Route & Service Handler",
    description: "Production-grade Next.js App Router API route with Zod validation, error handling, and Prisma ORM logic.",
    category: "Code",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    usageCount: 2150,
    isOfficial: true,
    prompt: `You are a Senior Full-Stack Engineer specializing in Next.js 16 (App Router), TypeScript, and Prisma. Write a complete, production-ready API route for {{feature_description}}.

Requirements:
1. Target table/model: {{database_table}}.
2. Auth requirement: {{auth_requirement}}.
3. Use Zod for strict body/query validation.
4. Implement try/catch error handling with proper HTTP status codes.
5. Return crisp TypeScript code with zero placeholder comments.`,
  },
  {
    id: "tpl_viral_x_thread",
    title: "Viral X (Twitter) Hook & Story Thread",
    description: "Compelling 7-tweet story thread designed for high engagement, retweets, and audience growth.",
    category: "Social Media",
    model: "gpt-4o-mini",
    usageCount: 1840,
    isOfficial: true,
    prompt: `You are a viral social media strategist. Write a 7-tweet thread sharing a core lesson about {{core_lesson}} targeting {{audience_persona}}.

Structure:
- Tweet 1: High-impact {{hook_type}} hook that stops scrolling immediately.
- Tweet 2-5: Step-by-step breakdown with crisp bullet points and actionable insights.
- Tweet 6: Summary metric or key takeaway.
- Tweet 7: Call to Action (CTA) asking readers to follow and retweet the first tweet.`,
  },
  {
    id: "tpl_tech_tutorial",
    title: "Step-by-Step Technical Guide & Tutorial",
    description: "Clear, beginner-friendly technical tutorial with code blocks, prerequisites, and common troubleshooting steps.",
    category: "Tutorial",
    model: "claude-3-5-sonnet-20241022",
    usageCount: 760,
    isOfficial: true,
    prompt: `You are a Principal Developer Advocate. Write an in-depth, step-by-step technical tutorial on {{technology}} for developers with {{skill_level}} experience.

Goal: {{end_goal}}

Sections:
1. Prerequisites & Required Tools.
2. Step-by-Step Walkthrough with complete code snippets.
3. Verification & Testing Commands.
4. Top 3 Common Pitfalls & Troubleshooting Solutions.`,
  },
  {
    id: "tpl_saas_landing_copy",
    title: "SaaS Landing Page Hero & Feature Copy",
    description: "High-converting SaaS landing page copy including Hero H1, Subheadline, Feature Pillars, and Social Proof triggers.",
    category: "Marketing",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    usageCount: 1290,
    isOfficial: true,
    prompt: `You are an elite SaaS landing page conversion strategist. Write complete landing page copy for {{saas_product}} built for {{target_customer}}.

Sections Required:
1. Hero Section: Punchy H1 headline, subheadline, and primary CTA button text.
2. Value Proposition Grid: 3 core benefit pillars highlighting {{primary_feature}}.
3. How It Works: 3-step customer onboarding breakdown.
4. Social Proof & FAQ: 3 objection-killing FAQ items.`,
  },
  {
    id: "tpl_python_async",
    title: "Production Python Async Pipeline",
    description: "Clean, performant Python async pipeline script using asyncio, aiohttp, and structured logging.",
    category: "Code",
    model: "meta/llama-3.3-70b-instruct",
    usageCount: 1610,
    isOfficial: true,
    prompt: `You are a Python Systems Architect. Write an asynchronous Python script for {{task_purpose}}.

Specifications:
1. Input format: {{input_data_format}}.
2. Error handling: {{error_handling_strategy}}.
3. Use asyncio and typing annotations.
4. Include structured JSON logging and graceful shutdown handling.`,
  },
  {
    id: "tpl_linkedin_thought_leadership",
    title: "LinkedIn Executive Industry Insights",
    description: "Polished LinkedIn post positioning you as an industry expert with strong formatting and conversation starters.",
    category: "Social Media",
    model: "gpt-4o-mini",
    usageCount: 1120,
    isOfficial: true,
    prompt: `You are an executive personal branding expert. Write an engaging LinkedIn post discussing {{key_insight}} in the {{industry}} sector.

Formatting Guidelines:
- Hook in the first 2 lines (before the 'see more' fold).
- Use single-sentence line breaks for mobile readability.
- Conclude with an open question to drive comments and CTA: {{cta}}.`,
  },
  {
    id: "tpl_sql_optimizer",
    title: "SQL Query & Indexing Strategy Audit",
    description: "Optimizes slow SQL queries, recommends composite indexes, and analyzes execution query plans.",
    category: "Code",
    model: "gpt-4o-mini",
    usageCount: 890,
    isOfficial: true,
    prompt: `You are a Principal Database Administrator. Analyze and optimize the following SQL query for {{database_engine}}:

Slow Query:
\`\`\`sql
{{slow_query}}
\`\`\`

Table Schema:
{{table_schema}}

Provide:
1. Rewritten optimal query with execution rationale.
2. Recommended indexes (B-Tree, GIN, composite) with DDL statements.
3. Memory and IO bottleneck breakdown.`,
  },
  {
    id: "tpl_midjourney_prompt",
    title: "Photorealistic AI Image Generation Blueprint",
    description: "Detailed DALL-E 3 & Midjourney v6 prompt with camera lens, lighting, composition, and rendering flags.",
    category: "Marketing",
    model: "gpt-4o-mini",
    usageCount: 1950,
    isOfficial: true,
    prompt: `Create a ultra-detailed photorealistic Midjourney v6 / DALL-E 3 image prompt for: {{subject}}.

Include exact parameters for:
- Lighting: {{lighting_style}}
- Camera Lens & Angle: {{camera_lens}}
- Aspect Ratio & Render Flags: --ar 16:9 --v 6.0 --style raw --q 2`,
  },
  {
    id: "tpl_ai_agent_system",
    title: "Autonomous AI Agent System Prompt & Tool Contract",
    description: "Production-grade system prompt defining persona, constraints, tool calling schema, and edge case safety guidelines.",
    category: "Code",
    model: "claude-3-5-sonnet-20241022",
    usageCount: 2310,
    isOfficial: true,
    prompt: `You are an Autonomous AI Agent designed for {{agent_role}}.

### IDENTITY & GOAL
Your core goal is: {{primary_goal}}

### SYSTEM RULES & CONSTRAINTS
1. Strict Tool Execution: Invoke available tools only when required arguments are verified.
2. Safety & Fallbacks: Never execute destructive operations without user confirmation.
3. Tone & Behavior: {{behavior_tone}}

### OUTPUT FORMAT
Provide concise, step-by-step reasoning followed by executable JSON tool calls.`,
  },
  {
    id: "tpl_youtube_script",
    title: "High-Retention YouTube Video Script",
    description: "Engaging 10-minute video script with visual cues, pattern interrupts, retention hooks, and CTA overlays.",
    category: "Social Media",
    model: "gpt-4o-mini",
    usageCount: 1480,
    isOfficial: true,
    prompt: `You are a YouTube viral strategist. Write a complete 8-minute video script on {{video_topic}} targeting {{target_viewer}}.

Script Structure:
- 0:00 - 0:30 Hook: High-stakes statement & visual pattern interrupt.
- 0:30 - 2:00 Context & Problem Statement.
- 2:00 - 6:00 Core Breakdown: 3 actionable steps with [Visual Cue] tags.
- 6:00 - 7:30 Common Mistakes & Key Takeaways.
- 7:30 - 8:00 Outro & End Screen CTA: {{end_cta}}.`,
  },
  {
    id: "tpl_product_launch",
    title: "Product Hunt & TechCrunch Launch Copy",
    description: "Compelling launch copy with tagline, founder story, key features bullet list, and maker comment.",
    category: "Marketing",
    model: "gpt-4o-mini",
    usageCount: 1730,
    isOfficial: true,
    prompt: `You are a startup launch copywriter. Write Product Hunt & TechCrunch launch copy for {{product_name}}, an innovative {{product_category}}.

Include:
1. Tagline (under 60 characters).
2. The Problem Statement: What pain does {{target_user}} face?
3. The Solution & Top 3 Features.
4. First Maker Comment introducing the team and special promo offer: {{launch_offer}}.`,
  },
  {
    id: "tpl_unit_test_suite",
    title: "Comprehensive Vitest / Jest Unit Test Suite",
    description: "Generates thorough unit & integration test cases with mock handlers, edge cases, and 100% code coverage.",
    category: "Code",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    usageCount: 1590,
    isOfficial: true,
    prompt: `You are a Lead QA Automation Engineer. Write a comprehensive Vitest / Jest test suite for the following TypeScript module:

Target Code:
\`\`\`typescript
{{code_to_test}}
\`\`\`

Requirements:
1. Cover happy paths, invalid inputs, boundary conditions, and async error rejections.
2. Mock external API calls and database connections.
3. Use descriptive test names (\`describe\`, \`it\`).`,
  },
  {
    id: "tpl_customer_support_sop",
    title: "Customer Support Resolution SOP & Email",
    description: "Empathetic, clear customer service response SOP for resolving billing, technical, or account issues.",
    category: "Email",
    model: "gpt-4o-mini",
    usageCount: 940,
    isOfficial: true,
    prompt: `You are a Customer Experience Manager. Write an empathetic, professional customer support email resolving a customer issue regarding {{issue_description}}.

Guidelines:
1. Acknowledge the inconvenience and validate their frustration.
2. Provide a clear 3-step resolution process.
3. Offer compensation or account credit: {{compensation_offer}}.
4. End with a personal escalation contact line.`,
  },
];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>(STATIC_OFFICIAL_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [exportItem, setExportItem] = useState<{ title: string; text: string } | null>(null);

  // Interactive Variable Filler State
  const [fillTemplate, setFillTemplate] = useState<TemplateItem | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const extractVariables = (promptText: string): string[] => {
    const matches = promptText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))));
  };

  const getFilledPrompt = (promptText: string, values: Record<string, string>): string => {
    let result = promptText;
    Object.entries(values).forEach(([k, v]) => {
      const regex = new RegExp(`\\{\\{${k}\\}\\}`, "g");
      result = result.replace(regex, v || `[${k}]`);
    });
    return result;
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterCategory !== "all") params.set("category", filterCategory);
        if (search.trim()) params.set("search", search.trim());
        if (onlyOfficial) params.set("isOfficial", "true");

        const res = await fetch(`/api/v1/templates?${params.toString()}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setTemplates(json.data);
          }
        }
      } catch {
        // keep static default
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [filterCategory, search, onlyOfficial]);

  const copyTemplate = async (template: TemplateItem) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);

    try {
      await fetch(`/api/v1/templates/${template.id}/use`, { method: "POST" });
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t))
      );
    } catch {
      // ignore tracking errors
    }

    setTimeout(() => setCopiedId(null), 2000);
  };

  const [forkingId, setForkingId] = useState<string | null>(null);

  const forkTemplate = async (template: TemplateItem) => {
    setForkingId(template.id);
    try {
      const res = await fetch("/api/v1/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          title: template.title,
          originalText: template.prompt,
          model: template.model || "gpt-4o-mini",
          category: template.category,
        }),
      });
      if (res.ok) {
        alert(`Successfully forked "${template.title}" into your personal Prompt Library!`);
      } else {
        alert("Please log in to fork templates into your personal library.");
      }
    } catch {
      alert("Failed to fork template.");
    } finally {
      setForkingId(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Marketing"];

  const getIcon = (category: string) => {
    switch (category) {
      case "Blog Post": return <FileText className="h-5 w-5 text-blue-500" />;
      case "Email": return <Mail className="h-5 w-5 text-green-500" />;
      case "Code": return <Code className="h-5 w-5 text-purple-500" />;
      case "Social Media": return <Share2 className="h-5 w-5 text-pink-500" />;
      case "Tutorial": return <Book className="h-5 w-5 text-amber-500" />;
      case "Marketing": return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Filter templates locally if search or category is active
  const filteredTemplates = templates.filter((t) => {
    if (filterCategory !== "all" && t.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (onlyOfficial && !t.isOfficial) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Template Marketplace</h2>
          <p className="text-xs text-muted-foreground">Ready-to-use prompts with variable placeholders</p>
        </div>
      </div>

      <div className="max-w-6xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 w-full sm:w-auto px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyOfficial(!onlyOfficial)}
            className={`h-9 w-full sm:w-auto px-3 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
              onlyOfficial
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5 text-blue-400" />
            Official Only
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded mb-1" />
                <div className="h-3 w-3/4 bg-muted rounded mb-3" />
                <div className="flex gap-1 mb-3">
                  <div className="h-4 w-12 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No templates match your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors hover-lift flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {getIcon(template.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-medium text-sm">{template.title}</h3>
                          {template.isOfficial && (
                            <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{template.category}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(template.id)}
                      className={`p-1 transition-colors ${
                        favorites[template.id] ? "text-amber-400 fill-amber-400" : "text-muted-foreground hover:text-amber-400"
                      }`}
                    >
                      <span className="sr-only">Favorite</span>
                      ★
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.model && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono">
                        {template.model}
                      </span>
                    )}
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">
                      {template.usageCount} uses
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const vars = extractVariables(template.prompt);
                      const initialVals: Record<string, string> = {};
                      vars.forEach((v) => (initialVals[v] = ""));
                      setVariableValues(initialVals);
                      setFillTemplate(template);
                    }}
                    className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Fill Variables
                  </button>
                  <button
                    type="button"
                    onClick={() => copyTemplate(template)}
                    className="h-8 px-2.5 rounded-lg border bg-background text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy raw template text"
                  >
                    {copiedId === template.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => forkTemplate(template)}
                    disabled={forkingId === template.id}
                    className="h-8 px-2.5 rounded-lg border bg-background text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Fork / Clone to Personal Library"
                  >
                    <GitFork className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportItem({ title: template.title, text: template.prompt })}
                    className="h-8 px-2.5 rounded-lg border bg-background text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Export to Code"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Variable Filler Modal */}
      {fillTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Customize Template Variables
                </h3>
                <p className="text-xs text-muted-foreground">{fillTemplate.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setFillTemplate(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Dynamic Variable Input Fields */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground block">Fill Template Variables</label>
              {extractVariables(fillTemplate.prompt).map((varName) => (
                <div key={varName} className="space-y-1">
                  <label className="text-xs font-medium text-foreground capitalize">
                    {varName.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={variableValues[varName] || ""}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [varName]: e.target.value }))}
                    placeholder={`Enter ${varName.replace(/_/g, " ")}...`}
                    className="w-full h-9 px-3 rounded-lg border bg-background text-xs outline-none focus:border-ring"
                  />
                </div>
              ))}
            </div>

            {/* Live Prompt Preview */}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-muted-foreground block">Live Custom Prompt Preview</label>
              <div className="p-3 rounded-lg border bg-accent/30 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {getFilledPrompt(fillTemplate.prompt, variableValues)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setFillTemplate(null)}
                className="px-3 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalPrompt = getFilledPrompt(fillTemplate.prompt, variableValues);
                  navigator.clipboard.writeText(finalPrompt);
                  alert("Custom filled prompt copied to clipboard!");
                  setFillTemplate(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors"
              >
                Copy Custom Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {exportItem && (
        <ExportCodeModal
          isOpen={!!exportItem}
          onClose={() => setExportItem(null)}
          title={exportItem.title}
          promptText={exportItem.text}
        />
      )}
    </div>
  );
}
