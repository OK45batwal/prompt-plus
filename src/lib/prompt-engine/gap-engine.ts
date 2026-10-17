import { QuestionCandidate, IntentExtractionResult } from "./types";

/** Entities that answer a gap, so the prompt is never told a slot is empty when it is not. */
const LANGUAGE_ENTITIES = new Set(["TypeScript", "JavaScript", "Python", "Rust", "Golang", "Java", "Node.js", "Deno", "Bun", "Ruby", "PHP", "C#", "C++", "Swift", "Kotlin", "Elixir", "Scala"]);
const STORAGE_ENTITIES = new Set(["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Prisma", "SQL"]);
const DATA_ENTITIES = new Set(["CSV", "JSON", "Excel", "pandas", "NumPy", "SQL", "PostgreSQL", "MySQL", "SQLite"]);

export interface ContextGap {
  id: string;
  field: string;
  description: string;
  impact: number; // 0.1 to 1.0
  uncertainty: number; // 0.1 to 1.0
  taskDependency: number; // 0.1 to 1.0
  importanceScore: number;
}

export function detectContextGaps(input: string, intent: IntentExtractionResult): ContextGap[] {
  const text = (input || "").toLowerCase();
  const gaps: ContextGap[] = [];
  // A slot is only "missing" if the request really did not name it. The old
  // checks looked for a short keyword list, so "the memory leak in our node.js
  // worker" was told that no language was named.
  const named = (set: Set<string>) => intent.slots.entities.some((entity) => set.has(entity));

  const addGap = (id: string, field: string, description: string, impact: number, uncertainty: number, taskDependency: number) => {
    const importanceScore = Math.round(impact * uncertainty * taskDependency * 100) / 100;
    gaps.push({ id, field, description, impact, uncertainty, taskDependency, importanceScore });
  };

  // Coding Gaps
  if (intent.taskType === "coding") {
    if (!named(LANGUAGE_ENTITIES) && !/\b(typescript|javascript|python|golang|rust|java|ruby|php|c\+\+|c#|swift|kotlin|elixir|scala|deno|bun|framework)\b/i.test(text)) {
      addGap("coding_language", "programming_language", "Which programming language or framework should be used?", 0.9, 0.9, 0.95);
    }
    if (!named(STORAGE_ENTITIES) && !/\b(database|postgres|mysql|sqlite|mongo|prisma|redis)\b/i.test(text) && /\b(app|backend|crud|system|user|auth)\b/i.test(text)) {
      addGap("coding_db", "database_choice", "What database technology or ORM is preferred?", 0.7, 0.8, 0.8);
    }
    if (!/\b(unit|test|integration|e2e|playwright|jest|vitest|pytest)\b/i.test(text)) {
      addGap("coding_testing", "testing_requirements", "What testing suite or coverage is required?", 0.5, 0.7, 0.6);
    }
  }

  // Writing & Marketing Gaps
  if (intent.taskType === "writing" || intent.taskType === "marketing") {
    if (!intent.slots.audience) {
      addGap("writing_audience", "target_audience", "Who is the primary target audience?", 0.85, 0.8, 0.9);
    }
    if (!intent.slots.tone) {
      addGap("writing_tone", "tone_profile", "What tone of voice should be adopted?", 0.7, 0.7, 0.75);
    }
    if (!/\b(length|word count|pages|short|long|concise|comprehensive)\b/i.test(text)) {
      addGap("writing_length", "output_length", "What is the expected length or format?", 0.6, 0.6, 0.65);
    }
  }

  // Data Analysis Gaps
  if (intent.taskType === "data_analysis") {
    if (!named(DATA_ENTITIES) && !/\b(csv|json|sql|pandas|dataframe|dataset|excel)\b/i.test(text)) {
      addGap("data_source", "dataset_format", "What is the input data format or schema?", 0.9, 0.85, 0.9);
    }
    if (!/\b(chart|table|summary|insights|plot|regression|metrics)\b/i.test(text)) {
      addGap("data_deliverable", "analysis_deliverable", "What specific metrics or chart outputs are required?", 0.8, 0.8, 0.85);
    }
  }

  // Image Generation Gaps
  if (intent.taskType === "image_generation") {
    if (!/\b(style|photorealistic|vector|3d|anime|minimalist|oil painting)\b/i.test(text)) {
      addGap("image_style", "art_style", "What visual style should be generated?", 0.9, 0.9, 0.9);
    }
    if (!/\b(aspect ratio|16:9|9:16|1:1|4:3)\b/i.test(text)) {
      addGap("image_aspect", "aspect_ratio", "What aspect ratio is needed?", 0.6, 0.7, 0.6);
    }
  }

  // Sort by importance descending
  return gaps.sort((a, b) => b.importanceScore - a.importanceScore);
}

/**
 * Turns the highest-importance gaps into rules the prompt states about itself.
 *
 * The engine detected what a request left unsaid and then threw it away, so the
 * executing model silently invented an answer. Naming the assumption costs one
 * line and is the honest version -- and it only appears when the request really
 * did leave the slot open.
 */
const GAP_STATEMENTS: Record<string, string> = {
  coding_language: "No language or framework is named in the request: state the one you are using before implementing.",
  coding_db: "No database is named: state the storage you are assuming.",
  coding_testing: "No test suite is named: include the tests you would write.",
  writing_audience: "No audience is named: state who you are writing for.",
  writing_tone: "No tone is named: state the register you are adopting.",
  writing_length: "No length is named: keep the answer as short as the task allows.",
  data_source: "No data format is named: state the format you are assuming.",
  data_deliverable: "No deliverable is named: state the metrics you are reporting.",
  image_style: "No visual style is named: state the style you are assuming.",
  image_aspect: "No aspect ratio is named: state the ratio you are assuming.",
};

export function gapsToConstraintTexts(gaps: ContextGap[], limit = 2): string[] {
  return gaps
    .slice(0, limit)
    .map((gap) => GAP_STATEMENTS[gap.id] || `No ${gap.field.replace(/_/g, " ")} is named: state the one you are assuming.`);
}

export function generateAdaptiveQuestions(gaps: ContextGap[], maxQuestions = 3): QuestionCandidate[] {
  const candidates: QuestionCandidate[] = [];

  for (const gap of gaps) {
    let questionText = `Could you clarify ${gap.field.replace(/_/g, " ")}?`;
    let options: string[] | undefined;

    if (gap.field === "programming_language") {
      questionText = "Which programming language or framework will be used?";
      options = ["TypeScript / Next.js", "Python / FastAPI", "Go", "Rust", "Node.js / Express"];
    } else if (gap.field === "target_audience") {
      questionText = "Who is the primary audience for this deliverable?";
      options = ["General Users / Consumers", "Software Developers & Technical Leads", "Executive Leadership", "Students & Learners"];
    } else if (gap.field === "tone_profile") {
      questionText = "What tone of voice should be used?";
      options = ["Professional & Authoritative", "Casual & Engaging", "Technical & Rigorous", "Persuasive & High-Conversion"];
    } else if (gap.field === "dataset_format") {
      questionText = "What format is the dataset in?";
      options = ["JSON / REST API", "CSV / Excel File", "PostgreSQL / SQL Database", "Raw Unstructured Text"];
    } else if (gap.field === "art_style") {
      questionText = "What visual style do you prefer?";
      options = ["Photorealistic / Cinematic", "Clean Minimalist Vector", "3D Render", "Modern Dark Tech UI"];
    }

    const uncertaintyReduction = gap.uncertainty * 0.9;
    const taskImpact = gap.impact;
    const estimatedUserEffort = options ? 1 : 2; // Low effort for multi-choice
    candidates.push({
      id: `q_${gap.id}`,
      field: gap.field,
      question: questionText,
      importance: gap.importanceScore,
      uncertaintyReduction,
      estimatedUserEffort,
      options,
      taskImpact,
    });
  }

  // Sort by calculated question value
  return candidates
    .sort((a, b) => (b.uncertaintyReduction * b.taskImpact) / b.estimatedUserEffort - (a.uncertaintyReduction * a.taskImpact) / a.estimatedUserEffort)
    .slice(0, maxQuestions);
}
