import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
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

// In-memory preferences store per user
const userPreferencesMap = new Map<string, UserPreferences>();

const defaultPreferences: UserPreferences = {
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

export const GET = withAuth(
  async (_req, { userId, requestId }) => {
    const prefs = userPreferencesMap.get(userId) || defaultPreferences;

    return jsonResponse(
      {
        data: prefs,
      },
      { requestId }
    );
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
    const current = userPreferencesMap.get(userId) || { ...defaultPreferences };
    const updated: UserPreferences = {
      ...current,
      ...body,
    };

    userPreferencesMap.set(userId, updated);

    return jsonResponse(
      {
        data: {
          success: true,
          preferences: updated,
        },
      },
      { requestId }
    );
  },
  { schema: preferencesSchema }
);
