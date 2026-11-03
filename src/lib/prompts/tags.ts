/**
 * Prompt Vault Tags Utility
 * Provides uniform parsing, normalization, and serializing of user tags.
 */

export function parseTags(raw?: string | null): string[] {
  if (!raw) return [];

  // Check if JSON-encoded array
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .map((t) => String(t).trim().replace(/^#+/, ""))
              .filter(Boolean)
          )
        );
      }
    } catch {
      // Fallback to comma-separated parsing
    }
  }

  // Parse comma-delimited strings
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().replace(/^#+/, ""))
        .filter(Boolean)
    )
  );
}

export function normalizeTags(tags?: string | string[] | null): string | null {
  if (!tags) return null;

  const tagList = Array.isArray(tags) ? tags : parseTags(tags);
  const cleaned = Array.from(
    new Set(
      tagList
        .map((t) => String(t).trim().replace(/^#+/, ""))
        .filter((t) => t.length > 0 && t.length <= 50)
    )
  );

  if (cleaned.length === 0) return null;
  return cleaned.join(", ");
}

