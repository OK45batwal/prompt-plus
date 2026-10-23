/**
 * localStorage keys. The values are part of users' saved data: renaming one
 * without a migration silently loses their drafts, history, or context.
 */
export const STORAGE_KEYS = {
  draft: "pp_studio_draft",
  history: "pp_local_history",
  preferences: "pp_prefs",
  legacyApiKeys: "promptplus_user_apikeys",
  contextBlocks: "promptplus_context_blocks",
  avatar: "pp_user_avatar",
} as const;
