import { z } from "zod";

export const getTemplatesQuerySchema = z.object({
  category: z.string().optional().default(""),
  model: z.string().optional().default(""),
  search: z.string().optional().default(""),
  isOfficial: z.coerce.boolean().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "name is required").max(150, "Title too long"),
  description: z.string().max(1000).optional().nullable(),
  prompt: z.string().min(1, "prompt is required"),
  category: z.string().optional().default("other"),
  models: z.array(z.string()).optional(),
  isOfficial: z.boolean().optional().default(false),
});
