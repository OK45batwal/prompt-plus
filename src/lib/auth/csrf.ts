import { NextRequest } from "next/server";

const PUBLISHED_EXTENSION_ID = "gdfaohfmmjjmpiggdcankjjihpljoccn";

function configuredOrigins(): string[] {
  const env = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    ...(process.env.TRUSTED_ORIGINS || "").split(","),
  ];
  const origins: string[] = [];
  for (const value of env) {
    const trimmed = (value || "").trim();
    if (!trimmed) continue;
    try {
      origins.push(new URL(trimmed).origin);
    } catch {
      // Ignore malformed configuration rather than trusting it.
    }
  }
  return origins;
}

function trustedExtensionIds(): string[] {
  const configured = (process.env.EXTENSION_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/^chrome-extension:\/\//, "").replace(/\/$/, ""))
    .filter(Boolean);
  return configured.length > 0 ? configured : [PUBLISHED_EXTENSION_ID];
}

function requestOrigin(req: NextRequest | Request): string | null {
  try {
    const url = new URL(req.url);
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host") || url.host;
    if (!host) return null;
    return `${proto}://${host}`;
  } catch {
    return null;
  }
}

function originAllowed(origin: string, req: NextRequest | Request): boolean {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  // Our own extension is an explicit client. Other extension ids are not.
  if (parsed.protocol === "chrome-extension:") {
    if (process.env.NODE_ENV !== "production") return true;
    return trustedExtensionIds().includes(parsed.hostname);
  }

  if (parsed.origin === requestOrigin(req)) return true;
  if (configuredOrigins().includes(parsed.origin)) return true;

  // Local development servers, never trusted in production.
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    return true;
  }

  return false;
}

/**
 * Validates state-changing API requests (POST, PUT, PATCH, DELETE) against CSRF attacks.
 * A cookie-authenticated request cannot skip the check by adding any header: only the
 * origin of the request itself (or an explicitly configured client) is trusted.
 */
export function validateCsrf(req: NextRequest | Request): { valid: boolean; reason?: string } {
  const method = req.method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  const headers = req.headers;

  // Browsers cannot attach these headers cross-site without a CORS preflight we never allow.
  const customHeader =
    headers.get("x-requested-with") ||
    headers.get("x-csrf-token") ||
    headers.get("x-promptplus-client");
  const contentType = headers.get("content-type") || "";

  if (!customHeader && !contentType.includes("application/json")) {
    return {
      valid: false,
      reason: "Missing anti-CSRF protection headers (expected custom header or application/json)",
    };
  }

  const origin = headers.get("origin");
  const referer = headers.get("referer");

  if (origin) {
    if (!originAllowed(origin, req)) {
      return { valid: false, reason: `CSRF origin mismatch: ${origin}` };
    }
    return { valid: true };
  }

  if (referer) {
    if (!originAllowed(referer, req)) {
      return { valid: false, reason: `CSRF referer mismatch: ${referer}` };
    }
    return { valid: true };
  }

  // No Origin/Referer: non-browser client (extension service worker, tests, curl).
  return { valid: true };
}
