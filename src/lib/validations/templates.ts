import { z } from "zod";

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

export const getTemplatesQuerySchema = z.object({
  category: z.string().optional().default(""),
  model: z.string().optional().default(""),
  search: z.string().optional().default(""),
  isOfficial: z.coerce.boolean().optional(),
});

export const createTemplateSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title too long").optional(),
  name: z.string().min(1, "Name is required").max(150, "Name too long").optional(),
  description: z.string().max(1000).optional().nullable(),
  prompt: z.string().min(1, "Prompt is required"),
  category: z.string().optional().default("General"),
  model: z.string().optional().nullable(),
  models: z.array(z.string()).optional(),
  isOfficial: z.boolean().optional().default(false),
});
