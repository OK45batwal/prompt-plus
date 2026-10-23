/**
 * Environment-derived values used by more than one module.
 *
 * `.env.example` is the operator-facing list; this file is where the app reads it.
 * Keep secrets out of source and out of the fallbacks below.
 */

/** Public origin used in emails and generated metadata. */
export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Sender shown to recipients. Production must set SMTP_FROM or SMTP_USER. */
export function emailFrom(): string {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "Prompt+ <no-reply@example.com>"
  );
}
