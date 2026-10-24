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
