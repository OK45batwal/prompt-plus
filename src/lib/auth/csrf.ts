import { NextRequest } from "next/server";

/**
 * Validates state-changing API requests (POST, PUT, PATCH, DELETE) against CSRF attacks.
 * Verifies request Origin / Referer header matching request Host and requires custom anti-CSRF header or JSON content type.
 */
export function validateCsrf(req: NextRequest | Request): { valid: boolean; reason?: string } {
  const method = req.method.toUpperCase();

  // Safe HTTP methods do not require CSRF validation
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  const headers = req.headers;
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  const host = headers.get("host") || headers.get("x-forwarded-host");

  // Check 1: Custom anti-CSRF header or standard application/json header
  const customHeader = headers.get("x-requested-with") || headers.get("x-csrf-token");
  const contentType = headers.get("content-type");

  if (!customHeader && (!contentType || !contentType.includes("application/json"))) {
    return {
      valid: false,
      reason: "Missing anti-CSRF protection headers (expected custom header or application/json)",
    };
  }

  // Check 2: Origin / Referer validation if present
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const expectedHost = host.split(":")[0];
      if (originUrl.hostname !== expectedHost) {
        return {
          valid: false,
          reason: `CSRF origin mismatch: ${originUrl.hostname} vs ${expectedHost}`,
        };
      }
    } catch {
      return { valid: false, reason: "Invalid Origin header URL format" };
    }
  } else if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      const expectedHost = host.split(":")[0];
      if (refererUrl.hostname !== expectedHost) {
        return {
          valid: false,
          reason: `CSRF referer mismatch: ${refererUrl.hostname} vs ${expectedHost}`,
        };
      }
    } catch {
      return { valid: false, reason: "Invalid Referer header URL format" };
    }
  }

  return { valid: true };
}
