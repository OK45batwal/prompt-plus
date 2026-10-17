import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1, "name is required").max(100, "Collection name is too long"),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(30).optional().default("#4f46e5"),
  icon: z.string().max(50).optional().default("folder"),
});
