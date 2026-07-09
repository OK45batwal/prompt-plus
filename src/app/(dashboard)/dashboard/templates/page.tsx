"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Copy, Check, FileText, Mail, Code, Share2, Book, ShoppingBag, Star, Zap } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  models: string[];
  icon: string;
  usageCount: number;
  prompt: string;
  isFavorite: boolean;
}

const mockTemplates: Template[] = [
  {
    id: "blog-post",
    name: "Blog Post",
    description: "Generate engaging blog posts with proper structure",
    category: "Blog Post",
    models: ["gpt-4", "claude-3", "gemini-pro"],
    icon: "file-text",
    usageCount: 1250,
    prompt: "Write a comprehensive blog post about [TOPIC].\n\nTarget audience: [AUDIENCE]\nTone: [TONE]\nLength: [LENGTH]\n\nInclude:\n- Engaging introduction\n- Well-structured sections with headers\n- Practical examples\n- Key takeaways\n- SEO-friendly structure",
    isFavorite: false,
  },
  {
    id: "email-campaign",
    name: "Email Campaign",
    description: "Create professional email sequences",
    category: "Email",
    models: ["gpt-4", "claude-3"],
    icon: "mail",
    usageCount: 890,
    prompt: "Write a professional email for [PURPOSE].\n\nSender: [COMPANY]\nRecipient: [AUDIENCE]\nGoal: [OBJECTIVE]\n\nInclude:\n- Compelling subject line\n- Clear, concise body\n- Strong call-to-action\n- Professional sign-off",
    isFavorite: true,
  },
  {
    id: "code-review",
    name: "Code Review",
    description: "Get detailed code review feedback",
    category: "Code",
    models: ["gpt-4", "claude-3"],
    icon: "code",
    usageCount: 756,
    prompt: "Review the following code for [LANGUAGE]:\n\n[CODE]\n\nProvide feedback on:\n- Code quality and readability\n- Performance optimization\n- Security vulnerabilities\n- Best practices\n- Suggested improvements",
    isFavorite: false,
  },
  {
    id: "social-media",
    name: "Social Media Post",
    description: "Create engaging social media content",
    category: "Social Media",
    models: ["gpt-4", "claude-3", "gemini-pro"],
    icon: "share",
    usageCount: 1580,
    prompt: "Create a [PLATFORM] post about [TOPIC].\n\nBrand voice: [TONE]\nAudience: [AUDIENCE]\nGoal: [OBJECTIVE]\n\nInclude:\n- Hook in first line\n- Relevant hashtags\n- Call-to-action\n- Emoji usage",
    isFavorite: false,
  },
  {
    id: "technical-doc",
    name: "Technical Documentation",
    description: "Write clear technical documentation",
    category: "Tutorial",
    models: ["gpt-4", "claude-3"],
    icon: "book",
    usageCount: 445,
    prompt: "Write technical documentation for [FEATURE/API].\n\nAudience: [DEVELOPER_LEVEL]\nFormat: [FORMAT]\n\nInclude:\n- Overview\n- Getting started guide\n- Code examples\n- API reference\n- Troubleshooting",
    isFavorite: true,
  },
  {
    id: "product-description",
    name: "Product Description",
    description: "Write compelling product descriptions",
    category: "Marketing",
    models: ["gpt-4", "claude-3", "gemini-pro"],
    icon: "shopping-bag",
    usageCount: 920,
    prompt: "Write a product description for [PRODUCT].\n\nFeatures: [FEATURES]\nTarget audience: [AUDIENCE]\nUnique selling point: [USP]\n\nInclude:\n- Attention-grabbing headline\n- Key benefits\n- Specifications\n- Social proof elements\n- Call-to-action",
    isFavorite: false,
  },
];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [templates, setTemplates] = useState(mockTemplates);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = (id: string) => {
    setTemplates(templates.map((t) => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
  };

  const categories = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Marketing"];

  const getIcon = (icon: string) => {
    switch (icon) {
      case "file-text": return <FileText className="h-5 w-5" />;
      case "mail": return <Mail className="h-5 w-5" />;
      case "code": return <Code className="h-5 w-5" />;
      case "share": return <Share2 className="h-5 w-5" />;
      case "book": return <Book className="h-5 w-5" />;
      case "shopping-bag": return <ShoppingBag className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Templates</h1>
            <p className="text-xs text-muted-foreground">{templates.length} ready-to-use templates</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
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
            className="h-9 px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {getIcon(template.icon)}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">{template.usageCount.toLocaleString()} uses</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(template.id)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <Star className={`h-4 w-4 ${template.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
              <div className="flex items-center gap-1 mb-3">
                {template.models.slice(0, 3).map((model) => (
                  <span key={model} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{model}</span>
                ))}
                {template.models.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">+{template.models.length - 3}</span>
                )}
              </div>
              <button
                onClick={() => copyTemplate(template)}
                className="w-full h-8 inline-flex items-center justify-center rounded-lg border text-xs font-medium hover:bg-accent transition-colors"
              >
                {copiedId === template.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Use Template
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
