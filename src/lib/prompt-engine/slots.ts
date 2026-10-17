/**
 * Deterministic slot extraction.
 *
 * Every strategy used to be input-blind: "debug a Node memory leak" and "add a
 * React component" produced the same persona, the same two constraints and the
 * same worked example, because the pipeline only ever asked "which category is
 * this?" and then applied that category's template. This module reads the
 * request itself -- the action, the thing acted on, the named technologies, the
 * output shape that was asked for -- with rules only: no model, no network, no
 * dependency.
 */

export interface PromptSlots {
  /** Canonical action verb, e.g. "debug". Null when no known verb appears. */
  action: string | null;
  /** The action exactly as the request wrote it, e.g. "improve". */
  actionWord: string | null;
  /** The text after the action, up to the first sentence break. */
  subject: string;
  /** Named technologies and products, in the order the request mentions them. */
  entities: string[];
  /** Output-shape requirements, e.g. "concise", "production", "tested". */
  modifiers: string[];
  /** Deliverable formats named in the request, e.g. "json", "table". */
  formats: string[];
  audience: string | null;
  /** Language register named in the request, e.g. "formal". */
  tone: string | null;
  wordCount: number;
  mentionsCode: boolean;
  /** Meaningful words of the request, used to score what survives enhancement. */
  contentWords: string[];
}

const ACTIONS: Record<string, string> = {
  build: "build",
  create: "build",
  develop: "build",
  implement: "build",
  construct: "build",
  scaffold: "build",
  make: "build",
  add: "build",
  write: "write",
  draft: "write",
  compose: "write",
  author: "write",
  debug: "debug",
  troubleshoot: "debug",
  diagnose: "debug",
  fix: "fix",
  repair: "fix",
  patch: "fix",
  refactor: "refactor",
  restructure: "refactor",
  cleanup: "refactor",
  simplify: "refactor",
  optimize: "optimize",
  optimise: "optimize",
  improve: "optimize",
  tune: "optimize",
  analyze: "analyze",
  analyse: "analyze",
  assess: "analyze",
  evaluate: "analyze",
  critique: "analyze",
  audit: "analyze",
  review: "review",
  summarize: "summarize",
  summarise: "summarize",
  condense: "summarize",
  explain: "explain",
  describe: "explain",
  clarify: "explain",
  teach: "explain",
  compare: "compare",
  contrast: "compare",
  migrate: "migrate",
  port: "migrate",
  upgrade: "migrate",
  convert: "convert",
  transform: "convert",
  translate: "translate",
  test: "test",
  verify: "test",
  validate: "test",
  document: "document",
  plan: "plan",
  schedule: "plan",
  outline: "plan",
  design: "design",
  generate: "generate",
  produce: "generate",
  rewrite: "rewrite",
  paraphrase: "rewrite",
  rephrase: "rewrite",
  polish: "rewrite",
  proofread: "rewrite",
  research: "research",
  investigate: "research",
  explore: "research",
  extract: "extract",
  parse: "extract",
  deploy: "deploy",
  publish: "deploy",
  ship: "deploy",
  measure: "measure",
  benchmark: "measure",
};

const ENTITIES: Array<[string, RegExp]> = [
  ["Next.js", /\bnext\.?js\b/i],
  ["NextAuth", /\bnextauth\b|\bnext-auth\b/i],
  ["React", /\breact\b/i],
  ["Vue", /\bvue\b/i],
  ["Svelte", /\bsvelte\b/i],
  ["Node.js", /\bnode(\.js)?\b/i],
  ["TypeScript", /\btypescript\b/i],
  ["JavaScript", /\bjavascript\b/i],
  ["Python", /\bpython\b/i],
  ["Rust", /\brust\b/i],
  ["Golang", /\bgolang\b/i],
  ["Java", /\bjava\b/i],
  ["Deno", /\bdeno\b/i],
  ["Bun", /\bbun\b/i],
  ["Ruby", /\bruby\b/i],
  ["PHP", /\bphp\b/i],
  ["C#", /\bc#/i],
  ["C++", /\bc\+\+/i],
  ["Swift", /\bswift\b/i],
  ["Kotlin", /\bkotlin\b/i],
  ["Elixir", /\belixir\b/i],
  ["Scala", /\bscala\b/i],
  ["PostgreSQL", /\bpostgres(ql)?\b/i],
  ["MySQL", /\bmysql\b/i],
  ["SQLite", /\bsqlite\b/i],
  ["MongoDB", /\bmongo(db)?\b/i],
  ["Redis", /\bredis\b/i],
  ["Prisma", /\bprisma\b/i],
  ["GraphQL", /\bgraphql\b/i],
  ["SQL", /\bsql\b/i],
  ["REST API", /\brest(ful)?\s+api\b/i],
  ["Tailwind CSS", /\btailwind\b/i],
  ["CSS", /\bcss\b/i],
  ["HTML", /\bhtml\b/i],
  ["Docker", /\bdocker\b/i],
  ["Kubernetes", /\b(kubernetes|k8s)\b/i],
  ["AWS", /\baws\b/i],
  ["Vercel", /\bvercel\b/i],
  ["Supabase", /\bsupabase\b/i],
  ["Stripe", /\bstripe\b/i],
  ["Playwright", /\bplaywright\b/i],
  ["Vitest", /\bvitest\b/i],
  ["Jest", /\bjest\b/i],
  ["pandas", /\bpandas\b/i],
  ["NumPy", /\bnumpy\b/i],
  ["JSON", /\bjson\b/i],
  ["CSV", /\bcsv\b/i],
  ["YAML", /\byaml\b/i],
  ["XML", /\bxml\b/i],
  ["Excel", /\bexcel\b/i],
  ["V8", /\bv8\b/i],
];

const MODIFIERS: Array<[string, RegExp]> = [
  ["concise", /\b(concise|succinct|brief|terse|short)\b|\b(?:under|fewer than)\s+\d+\s+words\b/i],
  ["detailed", /\b(detailed|comprehensive|exhaustive|in-?depth|thorough)\b/i],
  ["production", /\b(production[- ]?(grade|ready)|enterprise[- ]?(grade|ready)?|robust|scalable|resilient)\b/i],
  ["simple", /\b(simple|minimal(ist)?|basic|lightweight|beginners?)\b/i],
  ["fast", /\b(fast|performant|high[- ]performance|low[- ]latency|efficient)\b/i],
  ["secure", /\b(secure|hardened|sanitized|threat model)\b/i],
  ["accessible", /\b(accessible|a11y|wcag)\b/i],
  ["tested", /\b(tested|unit tests?|test coverage|with tests|well[- ]tested)\b/i],
];

const FORMATS: Array<[string, RegExp]> = [
  ["json", /\bjson\b/i],
  ["csv", /\bcsv\b/i],
  ["yaml", /\byaml\b/i],
  ["xml", /\bxml\b/i],
  ["table", /\b(table|tabular|matrix)\b/i],
  ["bullets", /\b(bullets?|bulleted|bullet points)\b/i],
  ["markdown", /\bmarkdown\b/i],
  ["diagram", /\b(diagram|flowchart|chart)\b/i],
];

const TONES: Array<[string, RegExp]> = [
  ["formal", /\b(formal|authoritative|professional)\b/i],
  ["casual", /\b(casual|friendly|conversational|witty|playful)\b/i],
  ["persuasive", /\b(persuasive|high[- ]conversion|compelling|punchy)\b/i],
  ["technical", /\b(technical|rigorous|precise)\b/i],
];

const AUDIENCES: Array<[string, RegExp]> = [
  ["students", /\bstudents?\b/i],
  ["beginners", /\b(beginners?|newcomers?)\b/i],
  ["executives", /\b(executives?|ceo|cto|cfo|boards?|managers?)\b/i],
  ["developers", /\b(developers?|engineers?|programmers?)\b/i],
  ["end users", /\b(customers?|clients?|users?|consumers?)\b/i],
];

const CODE_HINT = /\b(code|function|class|api|endpoint|component|bug|stack trace|compile|refactor|script|query|schema|test suite|server|database|regex|deploy|cli|library|package|module|framework|sdk|migration|cache|middleware|auth)\b/i;
const TECH_TERMS = /\b(next\.?js|nextauth|react|vue|svelte|node|typescript|javascript|python|rust|golang|java|postgres|mysql|sqlite|mongo|redis|prisma|graphql|sql|tailwind|css|html|docker|kubernetes|k8s|aws|vercel|supabase|stripe|playwright|vitest|jest|pandas|numpy|v8)\b/i;

const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "also", "always", "another", "any", "anyone", "anything",
  "around", "back", "because", "been", "before", "being", "below", "best", "better", "between", "both",
  "cannot", "could", "does", "doing", "done", "down", "during", "each", "either", "else", "enough", "even",
  "ever", "every", "everything", "except", "first", "from", "further", "gets", "give", "given", "goes",
  "going", "gone", "have", "having", "here", "hers", "herself", "himself", "however", "into", "itself",
  "just", "keep", "kind", "last", "later", "least", "less", "like", "made", "make", "makes", "many",
  "maybe", "might", "more", "most", "much", "must", "myself", "near", "need", "needs", "neither", "never",
  "next", "none", "nothing", "often", "once", "only", "other", "others", "otherwise", "ought", "ourselves",
  "over", "own", "perhaps", "please", "quite", "rather", "really", "right", "same", "shall", "should",
  "since", "some", "somebody", "someone", "something", "sometimes", "still", "such", "sure", "than", "that",
  "their", "theirs", "them", "themselves", "then", "there", "these", "they", "thing", "things", "this",
  "those", "though", "through", "thus", "together", "too", "toward", "under", "until", "upon", "used",
  "uses", "using", "very", "want", "wants", "well", "were", "what", "whatever", "when", "whenever",
  "where", "whereas", "whether", "which", "while", "whom", "whose", "will", "with", "within", "without",
  "would", "your", "yours", "yourself",
]);

function tokenize(text: string): Array<{ word: string; index: number }> {
  const tokens: Array<{ word: string; index: number }> = [];
  const re = /[A-Za-z][A-Za-z0-9+#]*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    tokens.push({ word: match[0].toLowerCase(), index: match.index });
  }
  return tokens;
}

function findAction(tokens: Array<{ word: string }>): { canonical: string; at: number } | null {
  const limit = Math.min(tokens.length, 15);
  for (let i = 0; i < limit; i++) {
    const canonical = ACTIONS[tokens[i].word];
    if (canonical) return { canonical, at: i };
  }
  return null;
}

/** Table order is priority order, so the first matching audience wins. */
function firstMatch(text: string, table: Array<[string, RegExp]>): string | null {
  for (const [value, pattern] of table) {
    if (pattern.test(text)) return value;
  }
  return null;
}

/** Table matches, ordered by where they appear in the request. */
function matchInOrder(text: string, table: Array<[string, RegExp]>, limit: number): string[] {
  const found: Array<{ value: string; at: number }> = [];
  for (const [value, pattern] of table) {
    const match = pattern.exec(text);
    if (match) found.push({ value, at: match.index });
  }
  found.sort((a, b) => a.at - b.at);
  return found.slice(0, limit).map((entry) => entry.value);
}

const SUBJECT_END = /[!?;\n]|\.\s|,\s*(?:and|then|but|also|so|with)\b/i;

function readSubject(text: string, from: number): string {
  const rest = text.slice(from);
  const end = rest.search(SUBJECT_END);
  const head = (end === -1 ? rest : rest.slice(0, end)).trim().replace(/[.,;:]+$/, "").trim();
  if (head.length <= 90) return head;
  // Cut at a word boundary so the goal never ends mid-word.
  return head.slice(0, 90).replace(/\s\S*$/, "");
}

function readContentWords(tokens: Array<{ word: string }>): string[] {
  const words: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (token.word.length < 4 || STOPWORDS.has(token.word) || seen.has(token.word)) continue;
    seen.add(token.word);
    words.push(token.word);
    if (words.length >= 40) break;
  }
  return words;
}

export function extractSlots(input: string): PromptSlots {
  const text = (input || "").trim();
  const tokens = tokenize(text);
  const action = findAction(tokens);
  const actionEnd = action ? tokens[action.at].index + tokens[action.at].word.length : 0;

  return {
    action: action ? action.canonical : null,
    actionWord: action ? tokens[action.at].word : null,
    subject: readSubject(text, actionEnd),
    entities: matchInOrder(text, ENTITIES, 4),
    modifiers: matchInOrder(text, MODIFIERS, 4),
    formats: matchInOrder(text, FORMATS, 3),
    audience: firstMatch(text, AUDIENCES),
    tone: firstMatch(text, TONES),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    mentionsCode: CODE_HINT.test(text) || TECH_TERMS.test(text),
    contentWords: readContentWords(tokens),
  };
}
