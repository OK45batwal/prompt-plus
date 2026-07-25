import { z } from "zod";

export const createPromptSchema = z.object({
  originalText: z
    .string()
    .min(1, "originalText is required")
    .max(10000, "Prompt text is too long (max 10,000 characters)"),
  model: z.string().min(1, "model is required"),
  category: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  length: z.string().optional().nullable(),
});

export const analyzePromptSchema = z.object({
  promptId: z.string().optional(),
  text: z
    .string()
    .min(1, "text is required")
    .max(10000, "Text is too long (max 10,000 characters)"),
});

export const scorePromptSchema = z.object({
  promptId: z.string().optional(),
  text: z
    .string()
    .min(1, "text is required")
    .max(10000, "Text is too long (max 10,000 characters)"),
});

export const enhancePromptSchema = z.object({
  promptId: z.string().optional(),
  text: z
    .string()
    .min(1, "text is required")
    .max(10000, "Text is too long (max 10,000 characters)"),
  model: z.string().optional(),
  provider: z.enum(["openai", "anthropic", "google", "openrouter", "local"]).optional(),
  category: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  userApiKey: z.string().optional(),
});
