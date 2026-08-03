import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { getTemplatesQuerySchema, createTemplateSchema } from "@/lib/validations/templates";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const revalidate = 3600; // Cache template listings for 1 hour

export function extractTemplateVariables(promptText: string): Array<{ name: string; label: string }> {
  if (!promptText) return [];
  const matches = promptText.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  const uniqueNames = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, "").trim())));
  return uniqueNames.map((name) => {
    const label = name
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { name, label };
  });
}

const OFFICIAL_TEMPLATES = [
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

export async function GET(request: NextRequest) {
  // Public template browsing allowed
  const { searchParams } = new URL(request.url);
  const queryResult = getTemplatesQuerySchema.safeParse({
    category: searchParams.get("category"),
    model: searchParams.get("model"),
    search: searchParams.get("search"),
    isOfficial: searchParams.get("isOfficial"),
  });

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: queryResult.error.flatten() },
      { status: 400 }
    );
  }

  const { category, model, search, isOfficial } = queryResult.data;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (model) where.model = model;
  if (typeof isOfficial === "boolean") where.isOfficial = isOfficial;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const dbTemplates = await getDb().template.findMany({
    where,
    orderBy: { usageCount: "desc" },
  }).catch(() => []);

  // Filter fallback official templates
  let fallback = OFFICIAL_TEMPLATES;
  if (category) fallback = fallback.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    fallback = fallback.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q));
  }

  // Merge database templates and official fallback templates (deduplicating by id)
  const existingIds = new Set(dbTemplates.map((t) => t.id));
  const combined = [...dbTemplates, ...fallback.filter((f) => !existingIds.has(f.id))];

  return jsonResponse({ data: combined });
}

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const validation = createTemplateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { title, name, description, category, model, isOfficial, prompt } = validation.data;

  const template = await getDb().template.create({
    data: {
      title: title || name || "Untitled Template",
      description,
      category,
      model: model || null,
      isOfficial: isOfficial ?? false,
      prompt,
    },
  });

  return jsonResponse({ data: template }, { status: 201 });
});
