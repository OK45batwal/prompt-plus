import { Example, TaskType } from "./types";
import { extractSlots } from "./slots";

/**
 * Few-shot examples, indexed by the terms a request actually uses.
 *
 * There used to be four pairs, one per broad category, so every coding request
 * received the same `paginateUsers` function and every writing request the same
 * dark-mode email. On top of the repetition, several of those outputs invented
 * statistics -- "costs by up to 80%", "45% CTR" -- which is exactly the
 * behaviour a few-shot example teaches a model to copy. Nothing here states a
 * number that is not given in its own input.
 */

export interface TaggedExample {
  taskType: TaskType;
  tags: string[];
  example: Example;
}

export const FEW_SHOT_LIBRARY: TaggedExample[] = [
  {
    taskType: "coding",
    tags: ["next.js", "nextauth", "auth", "session", "login"],
    example: {
      input: "Add session refresh to a NextAuth v5 setup.",
      output: "```typescript\n// app/api/auth/[...nextauth]/route.ts\nexport const { handlers, auth } = NextAuth({\n  session: { strategy: \"jwt\", maxAge: 60 * 30 },\n  callbacks: {\n    async jwt({ token, user }) {\n      if (user) return { ...token, refreshedAt: Date.now() };\n      return token;\n    },\n    async session({ session, token }) {\n      session.expires = new Date(Date.now() + 60 * 30 * 1000).toISOString();\n      return session;\n    },\n  },\n});\n```",
      explanation: "Shows the config shape and the two callbacks that actually move the expiry, with no narrative filler.",
    },
  },
  {
    taskType: "coding",
    tags: ["api", "endpoint", "rest", "route", "request", "validation"],
    example: {
      input: "Create a POST endpoint that accepts a JSON body.",
      output: "```typescript\nexport async function POST(request: Request) {\n  let body: unknown;\n  try {\n    body = await request.json();\n  } catch {\n    return Response.json({ error: \"Body must be valid JSON\" }, { status: 400 });\n  }\n  const parsed = Schema.safeParse(body);\n  if (!parsed.success) {\n    return Response.json({ error: parsed.error.issues }, { status: 422 });\n  }\n  return Response.json({ id: await insert(parsed.data) }, { status: 201 });\n}\n```",
      explanation: "Handles the malformed-body path separately from the invalid-shape path and returns the matching status for each.",
    },
  },
  {
    taskType: "coding",
    tags: ["rate", "limiting", "throttling", "redis", "middleware", "abuse"],
    example: {
      input: "Add per-IP rate limiting to an API route.",
      output: "```typescript\nconst WINDOW_SECONDS = 60;\nconst LIMIT = 30;\n\nexport async function guard(ip: string) {\n  const key = `rl:${ip}`;\n  const hits = await redis.incr(key);\n  if (hits === 1) await redis.expire(key, WINDOW_SECONDS);\n  if (hits > LIMIT) {\n    const ttl = await redis.ttl(key);\n    return { allowed: false, retryAfter: ttl > 0 ? ttl : WINDOW_SECONDS };\n  }\n  return { allowed: true, retryAfter: 0 };\n}\n```",
      explanation: "Sets the expiry on the first hit only, so the window cannot be extended indefinitely, and reports the real remaining TTL.",
    },
  },
  {
    taskType: "coding",
    tags: ["memory", "leak", "performance", "profiling", "heap", "v8"],
    example: {
      input: "Diagnose a Node.js process whose memory grows without bound.",
      output: "1. **Confirm it is the heap.** `process.memoryUsage()` per request; if `heapUsed` climbs while RSS is flat, it is allocation, not native handles.\n2. **Capture.** `node --inspect` plus a heap snapshot before and after the suspected path, then diff retained objects.\n3. **Common retained roots.** Module-level `Map`/`Set`, listeners added per request without `removeListener`, and closures captured in timers.\n4. **Prove the fix.** Re-run the same load and confirm the post-GC `heapUsed` baseline returns to its starting value.",
      explanation: "Each step names an observable check and what it rules in or out, instead of listing generic advice.",
    },
  },
  {
    taskType: "coding",
    tags: ["sql", "query", "postgres", "index", "database", "slow"],
    example: {
      input: "Speed up a slow filtered query on a large table.",
      output: "1. **Read the plan.** `EXPLAIN (ANALYZE, BUFFERS)` and look for `Seq Scan` where a `Index Scan` is possible.\n2. **Index the predicate.** A composite index on `(tenant_id, created_at DESC)` serves both the filter and the ordering, so the sort disappears.\n3. **Check selectivity.** An index on a low-cardinality column alone will not be chosen; lead with the selective column.\n4. **Re-measure.** Compare the same plan; the expected change is fewer shared buffers read, not only a lower time.",
      explanation: "Ties each suggestion to a specific line of the query plan and a measurement that can confirm it.",
    },
  },
  {
    taskType: "coding",
    tags: ["react", "component", "state", "props", "ui", "hook"],
    example: {
      input: "Build a search input that debounces its callback.",
      output: "```tsx\nexport function SearchInput({ onQuery, delayMs = 250 }: Props) {\n  const [value, setValue] = useState(\"\");\n\n  useEffect(() => {\n    const timer = setTimeout(() => onQuery(value), delayMs);\n    return () => clearTimeout(timer);\n  }, [value, delayMs, onQuery]);\n\n  return (\n    <input\n      type=\"search\"\n      aria-label=\"Search\"\n      value={value}\n      onChange={(event) => setValue(event.target.value)}\n    />\n  );\n}\n```",
      explanation: "Clears the pending timer on every change, so only the final keystroke fires the callback, and keeps the accessible label.",
    },
  },
  {
    taskType: "coding",
    tags: ["test", "tests", "vitest", "jest", "playwright", "coverage"],
    example: {
      input: "Write tests for a function that parses a duration string.",
      output: "```typescript\ndescribe(\"parseDuration\", () => {\n  it.each([\n    [\"90s\", 90],\n    [\"2m\", 120],\n    [\"1h30m\", 5400],\n  ])(\"parses %s as %i seconds\", (input, expected) => {\n    expect(parseDuration(input)).toBe(expected);\n  });\n\n  it.each([\"\", \"10\", \"5x\", \"-1m\"])(\"rejects %j\", (input) => {\n    expect(() => parseDuration(input)).toThrow();\n  });\n});\n```",
      explanation: "Pairs each accepted shape with the rejected ones, so the failure path is covered rather than assumed.",
    },
  },
  {
    taskType: "coding",
    tags: ["docker", "deploy", "deployment", "container", "ci", "pipeline"],
    example: {
      input: "Containerise a Node.js service for deployment.",
      output: "```dockerfile\nFROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=build /app/node_modules ./node_modules\nCOPY --from=build /app/.next ./.next\nCOPY package*.json ./\nUSER node\nCMD [\"npm\", \"start\"]\n```",
      explanation: "Installs with the lockfile, keeps build tooling out of the runtime image, and does not run as root.",
    },
  },
  {
    taskType: "data_analysis",
    tags: ["csv", "dataset", "metrics", "pandas", "summary", "data"],
    example: {
      input: "Summarise a CSV of support tickets.",
      output: "**Shape:** rows and columns, the date range covered, and the columns actually populated.\n\n**Distribution:** ticket counts by status and by assignee, as a percentage of the total rather than raw counts.\n\n**Trend:** volume per week, calling out the largest week-over-week change and the week it happened.\n\n**Caveats:** any column with missing values, and any period where the data is incomplete.",
      explanation: "Reports the shape and the caveats before the findings, so the reader can judge which numbers to trust.",
    },
  },
  {
    taskType: "data_analysis",
    tags: ["json", "extract", "schema", "parse", "structured"],
    example: {
      input: "Turn free-text records into structured JSON.",
      output: "```json\n{\n  \"records\": [\n    {\n      \"id\": \"r-1042\",\n      \"category\": \"billing\",\n      \"summary\": \"Invoice total did not match the plan price\",\n      \"fieldsMissing\": []\n    }\n  ],\n  \"unparsed\": [\"row 17: no category marker\"]\n}\n```",
      explanation: "Keeps a separate list for input it could not classify, instead of guessing a category or dropping the row.",
    },
  },
  {
    taskType: "writing",
    tags: ["email", "announcement", "update", "customers", "newsletter"],
    example: {
      input: "Write a short product update email announcing a new feature.",
      output: "**Subject:** Scheduled exports are now live\n\nHi {{first_name}},\n\nYou can now schedule a dashboard export and have it delivered on a repeating interval.\n\n**What changed**\n- Pick daily, weekly or monthly, with the timezone the export should follow.\n- Choose CSV or JSON per schedule.\n- Sent to the recipients you list, from the dashboard at any time.\n\n[Create a schedule](https://prompt-plus-three.vercel.app/dashboard)\n\n— The Prompt+ team",
      explanation: "States what changed, where to find it, and one action -- with no invented results or usage stats.",
    },
  },
  {
    taskType: "writing",
    tags: ["blog", "article", "post", "editorial", "draft"],
    example: {
      input: "Draft a short article explaining a technical decision.",
      output: "# Why we moved the cache out of the request path\n\n**The problem.** Cache reads sat inside the same handler as the response, so a slow cache added its latency to every request.\n\n**What we tried.** A longer timeout helped the average case and made the worst case worse, because a stalled read still blocked the response.\n\n**What we shipped.** The handler now answers from local state and refreshes the cache after responding.\n\n**What it cost.** Writes can lag the response by one cycle, which is acceptable for this data and would not be for a ledger.",
      explanation: "States the trade-off that was accepted and the case where it would be the wrong choice.",
    },
  },
  {
    taskType: "marketing",
    tags: ["landing", "copy", "headline", "conversion", "page", "marketing"],
    example: {
      input: "Write the top of a landing page for a developer tool.",
      output: "**Headline:** Ship the prompt, not the scaffold\n\n**Subhead:** Prompt+ turns a one-line request into a structured prompt you can read, edit and reuse -- before it reaches the model.\n\n**Primary action:** Open the Studio\n\n**Supporting points**\n- See the exact before-and-after diff before you accept it.\n- Runs on a deterministic engine, so the free tier needs no API key.\n- Works in the browser and in the extension.",
      explanation: "Every supporting point is a capability the product has, not a result it claims.",
    },
  },
  {
    taskType: "research",
    tags: ["research", "paper", "literature", "sources", "findings", "evidence"],
    example: {
      input: "Summarise what the sources agree and disagree on.",
      output: "**Question.** What the sources are being compared on, in one line.\n\n**Agreement.** Findings that at least two sources state, each with the source it came from.\n\n**Disagreement.** Where they diverge, and the difference in method or sample that plausibly explains it.\n\n**Not established.** What the available sources do not answer, stated as an open question rather than a conclusion.",
      explanation: "Separates what the sources support from what is still unknown, and attributes each finding to a source.",
    },
  },
  {
    taskType: "business",
    tags: ["strategy", "roadmap", "memo", "business", "plan", "priorities"],
    example: {
      input: "Write a short strategy memo on where to focus next quarter.",
      output: "**Decision requested.** The one thing the reader is being asked to approve.\n\n**Options.** Two or three named options, each with its cost and what it defers.\n\n**Recommendation.** The option chosen, and the evidence it rests on -- stated as what is known, not projected.\n\n**Risk.** The assumption that would make this the wrong call, and the signal that would show it early.",
      explanation: "Frames the memo as a request for a decision and names the assumption that would invalidate it.",
    },
  },
  {
    taskType: "general",
    tags: ["explain", "concept", "overview", "understand", "explanation"],
    example: {
      input: "Explain a technical concept to someone new to it.",
      output: "**In one line.** The concept, without jargon.\n\n**Why it exists.** The problem it was introduced to solve.\n\n**How it works.** Two or three steps, in order, at the level of the mechanism rather than the implementation.\n\n**Where it breaks.** The case it handles badly, so the reader knows its edges.",
      explanation: "Leads with the plain-language definition, then the mechanism, then the limits -- the order a newcomer needs.",
    },
  },
];

/**
 * Picks the example whose tags best overlap what the request asked for.
 * Deterministic: score ties fall to library order.
 */
export function selectFewShotExamples(taskType: TaskType, objective: string): Example[] {
  const slots = extractSlots(objective);
  const terms = new Set([...slots.entities.map((entity) => entity.toLowerCase()), ...slots.contentWords]);

  let best: TaggedExample | null = null;
  let bestScore = 0;

  for (const entry of FEW_SHOT_LIBRARY) {
    // Never demonstrate a writing pair for a coding task.
    const typeScore = entry.taskType === taskType ? 3 : entry.taskType === "general" ? 1 : 0;
    if (typeScore === 0) continue;

    // No tag overlap means the library has nothing on this topic. Injecting an
    // unrelated pair is worse than injecting none, so a vague request gets none.
    const hits = entry.tags.filter((tag) => terms.has(tag)).length;
    if (hits === 0) continue;

    const score = typeScore + hits;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best ? [best.example] : [];
}
