import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/templates - List prompt templates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const model = searchParams.get("model") || "";
  const search = searchParams.get("search") || "";

  // Built-in templates
  const templates = [
    {
      id: "blog-post",
      name: "Blog Post",
      description: "Generate engaging blog posts with proper structure",
      category: "blog_post",
      models: ["gpt-4", "claude-3", "gemini-pro"],
      icon: "file-text",
      usageCount: 1250,
      prompt: "Write a comprehensive blog post about [TOPIC].\n\nTarget audience: [AUDIENCE]\nTone: [TONE]\nLength: [LENGTH]\n\nInclude:\n- Engaging introduction\n- Well-structured sections with headers\n- Practical examples\n- Key takeaways\n- SEO-friendly structure",
    },
    {
      id: "email-campaign",
      name: "Email Campaign",
      description: "Create professional email sequences",
      category: "email",
      models: ["gpt-4", "claude-3"],
      icon: "mail",
      usageCount: 890,
      prompt: "Write a professional email for [PURPOSE].\n\nSender: [COMPANY]\nRecipient: [AUDIENCE]\nGoal: [OBJECTIVE]\n\nInclude:\n- Compelling subject line\n- Clear, concise body\n- Strong call-to-action\n- Professional sign-off",
    },
    {
      id: "code-review",
      name: "Code Review",
      description: "Get detailed code review feedback",
      category: "code_review",
      models: ["gpt-4", "claude-3"],
      icon: "code",
      usageCount: 756,
      prompt: "Review the following code for [LANGUAGE]:\n\n[CODE]\n\nProvide feedback on:\n- Code quality and readability\n- Performance optimization\n- Security vulnerabilities\n- Best practices\n- Suggested improvements",
    },
    {
      id: "social-media",
      name: "Social Media Post",
      description: "Create engaging social media content",
      category: "social_media",
      models: ["gpt-4", "claude-3", "gemini-pro"],
      icon: "share",
      usageCount: 1580,
      prompt: "Create a [PLATFORM] post about [TOPIC].\n\nBrand voice: [TONE]\nAudience: [AUDIENCE]\nGoal: [OBJECTIVE]\n\nInclude:\n- Hook in first line\n- Relevant hashtags\n- Call-to-action\n- Emoji usage",
    },
    {
      id: "technical-doc",
      name: "Technical Documentation",
      description: "Write clear technical documentation",
      category: "tutorial",
      models: ["gpt-4", "claude-3"],
      icon: "book",
      usageCount: 445,
      prompt: "Write technical documentation for [FEATURE/API].\n\nAudience: [DEVELOPER_LEVEL]\nFormat: [FORMAT]\n\nInclude:\n- Overview\n- Getting started guide\n- Code examples\n- API reference\n- Troubleshooting",
    },
    {
      id: "product-description",
      name: "Product Description",
      description: "Write compelling product descriptions",
      category: "content",
      models: ["gpt-4", "claude-3", "gemini-pro"],
      icon: "shopping-bag",
      usageCount: 920,
      prompt: "Write a product description for [PRODUCT].\n\nFeatures: [FEATURES]\nTarget audience: [AUDIENCE]\nUnique selling point: [USP]\n\nInclude:\n- Attention-grabbing headline\n- Key benefits\n- Specifications\n- Social proof elements\n- Call-to-action",
    },
  ];

  let filtered = templates;

  if (category) {
    filtered = filtered.filter((t) => t.category === category);
  }

  if (model) {
    filtered = filtered.filter((t) => t.models.includes(model));
  }

  if (search) {
    const lowerSearch = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerSearch) ||
        t.description.toLowerCase().includes(lowerSearch)
    );
  }

  return NextResponse.json({ data: filtered, total: filtered.length });
}

// POST /api/v1/templates - Save custom template
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, prompt, category, models } = body;

  if (!name || !prompt) {
    return NextResponse.json(
      { error: "name and prompt are required" },
      { status: 400 }
    );
  }

  // TODO: Get user from session
  const userId = "temp-user-id";

  // In production, save to database
  const template = {
    id: `custom-${Date.now()}`,
    userId,
    name,
    description,
    prompt,
    category,
    models,
    icon: "bookmark",
    usageCount: 0,
  };

  return NextResponse.json({ data: template }, { status: 201 });
}
