export interface CuratedPrompt {
  title: string;
  description: string;
  category: string;
  prompt: string;
  tags?: string[];
}

/**
 * Curated best prompts compiled from widely-shared prompt collections
 * and prompt-engineering best practices (awesome-chatgpt-prompts,
 * prompt engineering guides, role-prompting & framework patterns).
 */
export const curatedPrompts: CuratedPrompt[] = [
  {
    title: "Act as an Expert Programmer",
    description: "Get expert-level coding help with full context and constraints.",
    category: "coding",
    prompt:
      "Act as a senior software engineer with 15+ years of experience across Python, JavaScript, TypeScript, Go, and Rust. I need help with: {{task}}. Provide:\n1. A clean, production-grade solution with brief explanation\n2. Edge cases and error handling considerations\n3. Time and space complexity analysis\n4. Alternative approaches and when to use each\n5. Security and performance pitfalls to avoid",
    tags: ["coding", "expert"],
  },
  {
    title: "Code Review Partner",
    description: "Get a thorough, professional code review of your code.",
    category: "coding",
    prompt:
      "Act as a meticulous senior code reviewer. Review the following code and report:\n\n{{code}}\n\nFocus on:\n1. Correctness and logic bugs\n2. Security vulnerabilities (injection, auth, secrets)\n3. Performance issues and unnecessary allocations\n4. Readability and maintainability\n5. Testing gaps\n\nFor each finding, give severity (Critical/Major/Minor), a clear explanation, and a concrete fix.",
    tags: ["code-review", "quality"],
  },
  {
    title: "Debug My Code",
    description: "Systematically debug an error with root-cause analysis.",
    category: "coding",
    prompt:
      "Act as a debugging expert. Here is my code and the error I'm getting:\n\nCODE:\n{{code}}\n\nERROR:\n{{error}}\n\nWalk me through this systematically:\n1. What the error actually means\n2. Most likely causes, ordered by probability\n3. How to reproduce and confirm each hypothesis\n4. The fix, with the exact change to make\n5. How to prevent this class of bug in the future",
    tags: ["debugging", "fix"],
  },
  {
    title: "Architecture Advisor",
    description: "Get system design and architecture guidance with trade-offs.",
    category: "coding",
    prompt:
      "Act as a principal software architect. I'm designing: {{system}}. Here are the requirements:\n\n{{requirements}}\n\nProvide:\n1. A recommended architecture with a diagram in text/mermaid\n2. Tech stack choices with rationale\n3. Trade-offs and what you'd accept for a v1\n4. Scaling path from MVP to production\n5. Biggest risks and how to de-risk them",
    tags: ["architecture", "system-design"],
  },
  {
    title: "Explain Like I'm 5 (ELI5)",
    description: "Understand complex topics with simple, intuitive explanations.",
    category: "learning",
    prompt:
      "Explain {{topic}} to me as if I were a smart 5-year-old. Use simple analogies from everyday life, avoid jargon, and keep it under 250 words. Then, give me one intuitive example that makes it click.",
    tags: ["learning", "simplify"],
  },
  {
    title: "Teach Me a Topic Step by Step",
    description: "Master any topic through structured, progressive lessons.",
    category: "learning",
    prompt:
      "Act as an expert tutor. Teach me {{topic}} step by step:\n1. Assess what I should know first (list prerequisites)\n2. Break the topic into 5-7 progressive lessons, each with a concrete example\n3. After each concept, give me a small exercise to verify understanding\n4. Point out common misconceptions and where beginners get stuck\n5. End with a mini capstone task that combines everything",
    tags: ["learning", "tutor"],
  },
  {
    title: "Active Recall Quizzer",
    description: "Test your knowledge with spaced-repetition style questions.",
    category: "learning",
    prompt:
      "Quiz me on {{topic}} using active recall. Ask me one question at a time, starting with fundamentals and increasing difficulty. After I answer:\n1. Tell me if I'm right, and why\n2. If I'm wrong, explain the concept clearly with an example\n3. Track which topics I'm weak on\n4. Every 5 questions, summarize my weak areas\n5. At the end, suggest a focused study plan for my gaps",
    tags: ["learning", "quiz"],
  },
  {
    title: "Blog Post Writer",
    description: "Write a complete, structured blog post from a title or outline.",
    category: "writing",
    prompt:
      "Act as a professional blog writer. Write a complete blog post on: {{title}}.\n\nTarget audience: {{audience}}\nLength: {{length}} words\nTone: {{tone}}\n\nStructure it with:\n1. A hook intro that grabs attention\n2. Clear subheadings that scan well\n3. Concrete examples, data, or analogies in each section\n4. A practical, actionable conclusion\n5. A meta description and 5 SEO-friendly title options",
    tags: ["writing", "blog"],
  },
  {
    title: "Professional Email",
    description: "Draft clear, effective emails for any situation.",
    category: "writing",
    prompt:
      "Write a professional {{type}} email about: {{subject}}. Key points to include:\n{{points}}\n\nTone: {{tone}}\n\nRequirements:\n1. Clear subject line (under 8 words)\n2. Opens with context, then the ask or news\n3. Polished but human — no corporate-speak\n4. Ends with a specific next step or call to action\n5. Keep it under 150 words unless the topic requires more",
    tags: ["email", "writing"],
  },
  {
    title: "Persuasive Copywriter",
    description: "Create high-converting marketing copy with proven frameworks.",
    category: "marketing",
    prompt:
      "Act as a senior copywriter specialized in conversion copy. Write copy for {{product}} targeting {{audience}}. The key benefit is {{benefit}}.\n\nUse the AIDA framework (Attention, Interest, Desire, Action) and include:\n1. A headline with a compelling hook\n2. 3 benefit-driven subheadings\n3. A short body that speaks to the reader's pain points\n4. Social proof angle\n5. A clear, urgent call to action\n\nAlso give me 3 alternative headline options.",
    tags: ["marketing", "copywriting"],
  },
  {
    title: "Social Media Post",
    description: "Generate platform-ready social posts from any idea.",
    category: "marketing",
    prompt:
      "Create a {{platform}} post about: {{topic}}. Target audience: {{audience}}.\n\nDeliver:\n1. The main post (with hashtags)\n2. A hook variant that's more provocative\n3. A question-based variant to boost engagement\n4. A call-to-action suggestion\n5. Best time and frequency suggestion for this platform",
    tags: ["social-media", "marketing"],
  },
  {
    title: "Data Analyst",
    description: "Turn raw data into actionable insights and decisions.",
    category: "analysis",
    prompt:
      "Act as a senior data analyst. Analyze the following data:\n\n{{data}}\n\nContext: {{context}}\n\nProvide:\n1. Key patterns and trends, with specific numbers\n2. What's surprising or counterintuitive\n3. Recommendations grounded in the data\n4. What additional data would strengthen the analysis\n5. How to present this to a non-technical executive",
    tags: ["data", "analysis"],
  },
  {
    title: "SWOT Analysis",
    description: "Analyze any business or project with a structured SWOT.",
    category: "analysis",
    prompt:
      "Perform a thorough SWOT analysis for: {{subject}}.\n\nContext: {{context}}\n\nFor each quadrant (Strengths, Weaknesses, Opportunities, Threats):\n1. List 4-6 specific, non-generic items\n2. For each strength/weakness, explain WHY\n3. For each opportunity/threat, note the timeframe\n4. End with 3 strategic recommendations that leverage strengths and opportunities while mitigating weaknesses and threats",
    tags: ["business", "strategy"],
  },
  {
    title: "Critical Thinker",
    description: "Stress-test any idea or argument for logical soundness.",
    category: "analysis",
    prompt:
      "Act as a rigorous critical thinker and devil's advocate. I'll state a position: {{statement}}.\n\n1. Steelman the position (strongest version of it)\n2. Identify the strongest 3 objections or weaknesses\n3. For each objection, assess its severity\n4. Check for logical fallacies, hidden assumptions, and confirmation bias\n5. Give your balanced verdict, and what evidence would change your mind",
    tags: ["critical-thinking", "reasoning"],
  },
  {
    title: "Decision Matrix",
    description: "Make tough decisions with a structured comparison.",
    category: "productivity",
    prompt:
      "Help me decide between the following options using a weighted decision matrix.\n\nOptions: {{options}}\n\nCriteria (with relative weights): {{criteria}}\n\nFor each option:\n1. Score each criterion (1-10) with brief justification\n2. Compute the weighted total\n3. Flag any risks or unknowns\n4. Recommend the best option and the runner-up\n5. Suggest a quick way to validate the top choice before committing",
    tags: ["decisions", "productivity"],
  },
  {
    title: "Meeting Summarizer",
    description: "Turn messy meeting notes into clear actions and decisions.",
    category: "productivity",
    prompt:
      "Act as an executive assistant. Here are my raw meeting notes:\n\n{{notes}}\n\nTransform them into:\n1. A 3-5 sentence executive summary\n2. Key decisions made (with who decided what)\n3. Action items: owner, task, deadline — in a table\n4. Open questions that still need answers\n5. Anything that needs follow-up before the next meeting",
    tags: ["meetings", "productivity"],
  },
  {
    title: "Personal Brainstorming Partner",
    description: "Generate creative ideas and explore angles you missed.",
    category: "creativity",
    prompt:
      "Act as a creative brainstorming partner. The challenge is: {{challenge}}.\n\nGive me:\n1. 10 wild, diverse ideas (including unconventional ones)\n2. 3 ideas you think are most promising, and why\n3. For the best idea, a quick feasibility check\n4. 5 questions to reframe the challenge\n5. A 30-second pitch for the strongest concept",
    tags: ["creativity", "ideas"],
  },
  {
    title: "Role Play: Job Interview",
    description: "Practice interviews with realistic questions and feedback.",
    category: "career",
    prompt:
      "Act as a hiring manager interviewing for a {{role}} position. Ask me interview questions one at a time. Vary between:\n- Behavioral questions (STAR format)\n- Technical/skills questions\n- Situational judgment questions\n\nAfter each answer:\n1. Rate it on clarity, relevance, and impact (1-10)\n2. Tell me what worked\n3. Show me a stronger version of the answer\n\nAfter 6 questions, give me an overall assessment and top 3 improvement areas.",
    tags: ["interview", "career"],
  },
  {
    title: "Resume Enhancer",
    description: "Turn plain bullet points into strong, quantified resume lines.",
    category: "career",
    prompt:
      "Act as a professional resume writer. Improve these bullet points for a {{role}} resume:\n\n{{bullets}}\n\nFor each:\n1. Rewrite it with a strong action verb + impact\n2. Add quantification where possible (%, $, time saved, scale)\n3. Show a 'before → after' comparison\n4. Flag any claims that would be hard to defend in an interview",
    tags: ["resume", "career"],
  },
  {
    title: "Translation with Nuance",
    description: "Translate text preserving tone, idiom, and cultural context.",
    category: "writing",
    prompt:
      "Translate the following from {{source_language}} to {{target_language}}:\n\n{{text}}\n\nRequirements:\n1. Preserve tone, register, and intent\n2. Adapt idioms and cultural references naturally, with a note where you did so\n3. Keep technical terms accurate\n4. Provide the translation, then a 2-3 sentence note on your key translation choices",
    tags: ["translation", "languages"],
  },
  {
    title: "Legal Plain English",
    description: "Translate complex legal or policy text into simple language.",
    category: "analysis",
    prompt:
      "Act as a plain-language legal analyst. Rewrite the following in clear, simple English that a non-lawyer can understand:\n\n{{text}}\n\nThen provide:\n1. The plain-language version\n2. A 'key takeaways' list of 5 bullets\n3. Any obligations, rights, or deadlines the reader should watch for\n4. Anything ambiguous that a lawyer should clarify",
    tags: ["legal", "simplify"],
  },
  {
    title: "Design a Learning Path",
    description: "Build a personalized roadmap to learn any skill.",
    category: "learning",
    prompt:
      "Create a learning path for: {{skill}}. My current level: {{level}}. I can commit {{hours}} hours per week.\n\nDesign:\n1. A 12-week roadmap in phases (foundations → practice → projects)\n2. For each week: what to learn, resources, and a mini-project\n3. Free resources where possible\n4. How to measure progress each week\n5. A final capstone project that showcases the skill",
    tags: ["learning", "roadmap"],
  },
  {
    title: "Product Manager",
    description: "Get product strategy, PRDs, and prioritization help.",
    category: "productivity",
    prompt:
      "Act as a senior product manager. My product: {{product}}. Target users: {{users}}. The problem it solves: {{problem}}.\n\nDeliver:\n1. A one-page PRD outline with user stories and acceptance criteria\n2. A prioritized feature backlog (must-have, should-have, nice-to-have)\n3. Success metrics (north-star + guardrails)\n4. Top 3 risks and how to validate them cheaply\n5. A suggested MVP scope that can ship in 2 weeks",
    tags: ["product", "strategy"],
  },
];
