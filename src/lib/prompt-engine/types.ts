export type TaskType =
  | "coding"
  | "research"
  | "writing"
  | "rewriting"
  | "summarization"
  | "analysis"
  | "education"
  | "marketing"
  | "business"
  | "data_analysis"
  | "planning"
  | "creative"
  | "image_generation"
  | "video_generation"
  | "automation"
  | "prompt_engineering"
  | "general";

export type StrategyId =
  | "clarification"
  | "structure"
  | "constraints"
  | "output_contract"
  | "few_shot"
  | "decomposition"
  | "verification"
  | "context_compression"
  | "schema_enforcement"
  | "model_specific"
  | "ambiguity_reduction";

export type ConstraintPriority = "critical" | "high" | "medium" | "low";
export type ConstraintSource = "user" | "inferred" | "system";

export interface Constraint {
  id?: string;
  text: string;
  priority: ConstraintPriority;
  source: ConstraintSource;
}

export interface Instruction {
  id?: string;
  stepNumber?: number;
  text: string;
  isRequired?: boolean;
}

export interface InputDefinition {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface OutputContract {
  format: "markdown" | "json" | "code" | "text" | "bullets" | "table" | "custom";
  schema?: Record<string, unknown> | string;
  sections?: string[];
  maxTokens?: number;
  styleNotes?: string[];
}

export interface EvaluationCriteria {
  name: string;
  weight: number;
  description?: string;
}

export interface ReasoningConfig {
  effort?: "minimal" | "low" | "medium" | "high";
  mandateStepByStep?: boolean;
}

export interface VerbosityConfig {
  level?: "low" | "medium" | "high";
  targetWordCount?: number;
}

export interface ContextBlock {
  id?: string;
  content: string;
  type: "document" | "conversation" | "reference" | "example" | "user_data";
  trustLevel: "trusted" | "untrusted";
  relevanceScore: number;
}

export interface PromptMetadata {
  id?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  author?: string;
  tags?: string[];
  fingerprint?: string;
}

export interface PromptIR {
  role?: string;
  objective: string;
  context: ContextBlock[];
  inputs: InputDefinition[];
  instructions: Instruction[];
  constraints: Constraint[];
  examples: Example[];
  output: OutputContract;
  evaluation?: EvaluationCriteria[];
  audience?: string;
  tone?: string;
  language?: string;
  reasoningConfig?: ReasoningConfig;
  verbosityConfig?: VerbosityConfig;
  metadata: PromptMetadata;
}

export interface IntentExtractionResult {
  domain: string;
  taskType: TaskType;
  goal: string;
  audience?: string;
  platform?: string;
  complexity: "low" | "medium" | "high" | "expert";
  outputType: string;
  assumptions: string[];
  unknowns: string[];
  intentPreservationScore?: number;
}

export interface QuestionCandidate {
  id: string;
  field: string;
  question: string;
  importance: number;
  uncertaintyReduction: number;
  estimatedUserEffort: number;
  options?: string[];
  taskImpact: number;
}

export interface ModelProfile {
  provider: string;
  model: string;
  contextWindow: number;
  supportsReasoning: boolean;
  supportsStructuredOutput: boolean;
  supportsTools: boolean;
  reasoningLevels?: string[];
  verbosityLevels?: string[];
  strengths: string[];
  limitations: string[];
}

export interface PromptCandidate {
  id: string;
  name: string;
  strategyName: string;
  ir: PromptIR;
  renderedText: string;
  efficiencyScore: number;
  estimatedTokens: number;
  score?: number;
}

export type FailureType =
  | "WRONG_INTENT"
  | "MISSING_CONTEXT"
  | "AMBIGUOUS"
  | "CONSTRAINT_VIOLATION"
  | "FORMAT_FAILURE"
  | "INCOMPLETE"
  | "OVERLY_VERBOSE"
  | "HALLUCINATION_RISK"
  | "UNSUPPORTED_CLAIM"
  | "SECURITY_RISK"
  | "INSTRUCTION_CONFLICT";

export interface EvaluationCase {
  id: string;
  datasetId: string;
  input: string;
  expectedOutput?: string;
  criteria?: EvaluationCriteria[];
}

export interface EvaluationResult {
  caseId: string;
  promptVersionId: string;
  output: string;
  score: number;
  failures: FailureType[];
  latencyMs: number;
  tokenUsage: number;
}

export interface OptimizationRun {
  id: string;
  promptId: string;
  originalPrompt: string;
  taskType: TaskType;
  targetModel?: string;
  strategies: StrategyId[];
  candidates: PromptCandidate[];
  selectedCandidate?: PromptCandidate;
  baselineScore?: number;
  finalScore?: number;
  iterations: number;
  tokensUsed: number;
  estimatedCost?: number;
  status: "pending" | "running" | "completed" | "failed";
}

export interface SecurityScanResult {
  hasSecrets: boolean;
  secretsDetected: string[];
  hasPII: boolean;
  piiDetected: string[];
  isPromptInjection: boolean;
  riskScore: number;
  isSafe: boolean;
  privacyRecommendedAction: "proceed" | "sanitize" | "local_only" | "block";
}
