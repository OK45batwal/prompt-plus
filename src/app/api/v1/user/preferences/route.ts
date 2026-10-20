import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { getDb } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export interface UserPreferences {
  // AI Engine Preferences
  defaultEngineMode: "api" | "algorithmic" | "device";
  defaultStrategy: "structured" | "concise" | "model_tuned" | "detailed";
  defaultOutputFormat: "markdown" | "xml" | "json";
  enableAutoCorrect: boolean;
  enableZeroFluff: boolean;
  enableSoundEffects: boolean;
  developerRole: string;

  // Notification Preferences
  emailNotifications: boolean;
  usageAlerts: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
}

export const defaultPreferences: UserPreferences = {
  defaultEngineMode: "api",
  defaultStrategy: "structured",
  defaultOutputFormat: "markdown",
  enableAutoCorrect: true,
  enableZeroFluff: true,
  enableSoundEffects: false,
  developerRole: "Prompt Architect",

  emailNotifications: true,
  usageAlerts: true,
  weeklyDigest: false,
  productUpdates: true,
  securityAlerts: true,
};

/**
 * Reads one user's row. A previous version kept this in a process-local Map, so
 * preferences vanished on redeploy and never reached another device.
 */
async function readPreferences(userId: string): Promise<UserPreferences> {
  const row = await getDb().userPreference.findUnique({ where: { userId }, select: { data: true } });
  const stored = (row?.data ?? {}) as Partial<UserPreferences>;
  return { ...defaultPreferences, ...stored };
}

export const GET = withAuth(
  async (_req, { userId, requestId }) => {
    const prefs = await readPreferences(userId);
    return jsonResponse({ data: prefs }, { requestId });
  }
);

const preferencesSchema = z.object({
  defaultEngineMode: z.enum(["api", "algorithmic", "device"]).optional(),
  defaultStrategy: z.enum(["structured", "concise", "model_tuned", "detailed"]).optional(),
  defaultOutputFormat: z.enum(["markdown", "xml", "json"]).optional(),
  enableAutoCorrect: z.boolean().optional(),
  enableZeroFluff: z.boolean().optional(),
  enableSoundEffects: z.boolean().optional(),
  developerRole: z.string().max(50).optional(),

  emailNotifications: z.boolean().optional(),
  usageAlerts: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
});

export const PATCH = withAuth(
  async (_req, { userId, requestId, body }) => {
    const current = await readPreferences(userId);
    const updated: UserPreferences = { ...current, ...body };

    // Validated above; Prisma's Json input type only needs the object shape.
    const data = updated as unknown as Prisma.InputJsonValue;
    await getDb().userPreference.upsert({
      where: { userId },
      create: { userId, data },
      update: { data },
    });

    return jsonResponse({ data: { success: true, preferences: updated } }, { requestId });
  },
  { schema: preferencesSchema }
);
