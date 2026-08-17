import { Example, TaskType } from "./types";

/**
 * Synthesizes domain-specific Few-Shot Input -> Output example pairs based on task type.
 * Injecting realistic few-shot pairs drastically increases LLM output accuracy and schema adherence.
 */
export function synthesizeFewShotExamples(taskType: TaskType, objective: string): Example[] {
  const examples: Example[] = [];
  const lowerObj = objective.toLowerCase();

  if (taskType === "coding" || lowerObj.includes("code") || lowerObj.includes("api") || lowerObj.includes("react") || lowerObj.includes("function")) {
    examples.push({
      input: "Write a TypeScript helper function to filter and paginate an array of user objects.",
      output: `\`\`\`typescript
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginateUsers(
  users: User[],
  page: number = 1,
  pageSize: number = 10,
  activeOnly: boolean = false
): PaginatedResult<User> {
  if (page < 1) throw new Error("Page number must be >= 1");
  if (pageSize < 1) throw new Error("Page size must be >= 1");

  const filtered = activeOnly ? users.filter((u) => u.active) : users;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const data = filtered.slice(startIndex, startIndex + pageSize);

  return { data, total, page, pageSize, totalPages };
}
\`\`\``,
      explanation: "Includes explicit TypeScript interfaces, parameter defaults, boundary checks (throwing on invalid page numbers), and complete pagination metadata.",
    });
  } else if (taskType === "data_analysis" || lowerObj.includes("json") || lowerObj.includes("schema") || lowerObj.includes("data") || lowerObj.includes("format")) {
    examples.push({
      input: "Extract key metrics from customer review data into a clean JSON structure.",
      output: `\`\`\`json
{
  "summary": {
    "totalReviews": 150,
    "averageRating": 4.6,
    "sentimentDistribution": {
      "positive": 82,
      "neutral": 12,
      "negative": 6
    }
  },
  "topThemes": ["Fast Delivery", "UI Simplicity", "Responsive Support"],
  "actionItems": [
    {
      "priority": "high",
      "issue": "Intermittent mobile checkout error",
      "assignedTeam": "Engineering"
    }
  ]
}
\`\`\``,
      explanation: "Returns strict valid JSON with zero conversational fluff prose or markdown preamble outside the code fence.",
    });
  } else if (taskType === "writing" || lowerObj.includes("email") || lowerObj.includes("post") || lowerObj.includes("article") || lowerObj.includes("blog")) {
    examples.push({
      input: "Draft a product update email announcing a new dark mode feature.",
      output: `**Subject:** 🌙 Dark Mode is Here — Easy on the Eyes, Built for Speed

Hi {{first_name}},

You asked, we delivered. Starting today, you can switch Prompt+ to OLED Dark Mode with a single click.

**What's New:**
• **OLED Black Palette:** Pure #09090b background designed for late-night prompt engineering.
• **Instant Toggle:** Syncs automatically with your system preference or browser theme.
• **Hairline Contrast:** High-legibility text designed to reduce eye strain over long sessions.

Try it out now in your dashboard settings:
👉 [Switch to Dark Mode](https://prompt-plus-three.vercel.app/dashboard/settings)

Happy prompting,  
The Prompt+ Team`,
      explanation: "Uses an engaging subject line, clear bulleted value points, bold formatting for scannability, and a clear single Call to Action (CTA).",
    });
  } else {
    examples.push({
      input: "Summarize the key architectural decisions of a serverless database strategy.",
      output: `### Core Architectural Highlights

1. **Auto-Scaling Compute:** Computes scale automatically to zero during idle periods, reducing standby infrastructure costs by up to 80%.
2. **Connection Pooling:** Uses HTTP-based proxy connection pooling to eliminate TCP overhead on serverless Lambdas/Edge functions.
3. **Point-in-Time Recovery:** Automated daily snapshots with continuous WAL logging for 30-day rollbacks.

### Risk Mitigation Matrix
- **Cold Start Latency:** Mitigated via regional edge warming requests.
- **Connection Spikes:** Rate-limited via API Gateway middleware.`,
      explanation: "Structured into crisp H3 headings, numbered technical decisions, bolded terminology, and a risk mitigation matrix.",
    });
  }

  return examples;
}
