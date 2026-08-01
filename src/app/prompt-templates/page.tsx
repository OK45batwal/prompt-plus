import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Curated AI Prompt Templates — Prompt+",
  description: "Browse curated, production-grade prompt templates for Coding, Marketing, Writing, and Data Analysis.",
};

const TEMPLATES = [
  {
    category: "Coding & Architecture",
    title: "Senior Full-Stack Code Reviewer",
    description: "Evaluates PRs for performance bottlenecks, security flaws, and type safety.",
    prompt: "You are a Principal Software Engineer. Review the following code snippet for security vulnerabilities, memory leaks, and performance optimization opportunities..."
  },
  {
    category: "Marketing & Strategy",
    title: "SaaS Value Proposition Generator",
    description: "Generates high-converting landing page headlines and hook stories.",
    prompt: "You are a Tech Marketing Director. Craft 3 distinct landing page headlines and value propositions for the target audience below..."
  },
  {
    category: "Writing & Content",
    title: "Technical Blog Post Editor",
    description: "Polishes rough technical notes into structured, engaging developer articles.",
    prompt: "You are a Technical Writer at a top tech company. Transform the following bullet points into a clear, comprehensive technical blog post..."
  },
  {
    category: "Data & Analytics",
    title: "SQL Query & Performance Optimizer",
    description: "Analyzes complex SQL queries and suggests index strategies and query rewrites.",
    prompt: "You are a Lead Database Architect. Analyze the following SQL query and schema definitions to identify missing indexes and execution bottlenecks..."
  }
];

export default function PromptTemplatesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-3">
          Curated AI Prompt Templates
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Battle-tested system prompt templates for ChatGPT, Claude, and Gemini. Free to copy and customize.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES.map((tpl, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {tpl.category}
              </span>
              <h2 className="text-lg font-bold mt-1 mb-2">{tpl.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{tpl.description}</p>
              <pre className="p-3 rounded-lg bg-muted text-xs whitespace-pre-wrap font-mono overflow-x-auto max-h-32 mb-4 border">
                {tpl.prompt}
              </pre>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Use & Enhance in Prompt+ →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
