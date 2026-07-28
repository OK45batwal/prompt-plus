import { z } from "zod";
import { logger } from "@/lib/logger";

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export const emailSchema = z
  .string()
  .min(1)
  .max(255)
  .email()
  .transform((e) => e.toLowerCase().trim());

export type PaginationQuery = z.infer<typeof paginationSchema>;

export const signupSchema = z.object({
  name: z.string().trim().max(100).transform(stripHtml).optional().default(""),
  email: z.string().min(1).max(255).email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email is required"),
});

export function logRejection(route: string, error: z.ZodError, extra?: Record<string, unknown>) {
  logger.warn(`Auth validation rejected`, {
    route,
    issues: error.issues.map((i) => ({ path: i.path.join("."), code: i.code })),
    ...extra,
  });
}