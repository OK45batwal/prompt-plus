// ─── User Types ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: string;
  onboardingCompleted: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// ─── Prompt Types ────────────────────────────────────────────────────────────

export interface Prompt {
  id: string;
  userId: string;
  title: string | null;
  originalText: string;
  enhancedText: string | null;
  model: string;
  category: string | null;
  tone: string | null;
  length: string | null;
  score: Score | null;
  tags: string[];
  isSaved: boolean;
  isFavorite: boolean;
  collectionId: string | null;
  sharedToken: string | null;
  lastAction: string | null;
  createdAt: Date;
  updatedAt: Date;
  enhancedAt: Date | null;
}

export interface Score {
  clarity: number;
  specificity: number;
  context: number;
  completeness: number;
  overall: number;
}

// ─── Analysis Types ──────────────────────────────────────────────────────────

export interface Analysis {
  id: string;
  promptId: string;
  intent: IntentType;
  category: CategoryType;
  complexity: 1 | 2 | 3 | 4 | 5;
  confidence: number;
  entities: string[];
  context: string[];
  keywords: string[];
  missing: MissingRequirement[];
  suggestions: Suggestion[];
  createdAt: Date;
}

export type IntentType =
  | "content_generation"
  | "code_generation"
  | "image_generation"
  | "data_analysis"
  | "email"
  | "education"
  | "business"
  | "creative";

export type CategoryType =
  | "blog_post"
  | "article"
  | "tutorial"
  | "documentation"
  | "email"
  | "social_media"
  | "function"
  | "class"
  | "api_endpoint"
  | "unit_test"
  | "code_review"
  | "debugging"
  | "image"
  | "logo"
  | "illustration"
  | "data_visualization"
  | "report"
  | "presentation"
  | "other";

export interface MissingRequirement {
  field: string;
  label: string;
  priority: "high" | "medium" | "low";
}

export interface Suggestion {
  text: string;
  impact: "high" | "medium" | "low";
  category: string;
}

// ─── Collection Types ────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Template Types ──────────────────────────────────────────────────────────

export interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  prompt: string;
  variables: TemplateVariable[];
  model: string | null;
  usageCount: number;
  isOfficial: boolean;
  createdAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: "text" | "textarea" | "select" | "number" | "boolean";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: unknown;
}

// ─── API Key Types ───────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  userId: string;
  provider: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  usageCount: number;
  createdAt: Date;
}

export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "deepseek"
  | "ollama"
  | "lmstudio";

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  totalPrompts: number;
  totalEnhancements: number;
  averageScore: number;
  promptsThisWeek: number;
  enhancementsThisWeek: number;
}

// ─── Usage Types ─────────────────────────────────────────────────────────────

export interface UsageStats {
  promptsUsed: number;
  promptsLimit: number;
  analysesUsed: number;
  analysesLimit: number;
  hasApiKey: boolean;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
