import { SecurityScanResult } from "./types";

export function scanPromptSecurity(input: string): SecurityScanResult {
  const text = input || "";
  const secretsDetected: string[] = [];
  const piiDetected: string[] = [];

  // Secret Detection Patterns (Independent checks)
  if (/sk-proj-[a-zA-Z0-9_-]{20,}/.test(text)) secretsDetected.push("OpenAI API Key (sk-proj)");
  if (/sk-or-v1-[a-zA-Z0-9_-]{20,}/.test(text)) secretsDetected.push("OpenRouter API Key (sk-or)");
  if (/nvapi-[a-zA-Z0-9_-]{20,}/.test(text)) secretsDetected.push("NVIDIA API Key (nvapi)");
  if (/sk-ant-[a-zA-Z0-9_-]{20,}/.test(text)) secretsDetected.push("Anthropic API Key (sk-ant)");
  if (/\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/.test(text)) secretsDetected.push("GitHub Access Token");
  if (/\bAKIA[0-9A-Z]{16}\b/.test(text)) secretsDetected.push("AWS Access Key ID");
  if (/\b(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}\b/.test(text)) secretsDetected.push("Stripe API Key");
  if (/\bAIza[0-9A-Za-z\-_]{35}\b/.test(text)) secretsDetected.push("Google Cloud / Firebase API Key");
  if (/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/i.test(text)) secretsDetected.push("Database Connection String");
  if (/\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/.test(text)) secretsDetected.push("JWT Token");
  if (/password\s*[:=]\s*['"][^'"]+['"]/i.test(text)) secretsDetected.push("Hardcoded Password");

  // PII Detection Patterns
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) piiDetected.push("Email Address");
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) piiDetected.push("Phone Number");
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) piiDetected.push("Social Security Number (SSN)");
  if (/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/.test(text)) piiDetected.push("Credit Card Number");

  // Prompt Injection Patterns
  let isPromptInjection = false;
  if (
    /ignore\s+(all\s+)?previous\s+instructions/i.test(text) ||
    /system\s+override/i.test(text) ||
    /you\s+are\s+now\s+in\s+DAN\s+mode/i.test(text) ||
    /\bjailbreak\b/i.test(text) ||
    /disregard\s+(all\s+)?prior/i.test(text)
  ) {
    isPromptInjection = true;
  }

  const hasSecrets = secretsDetected.length > 0;
  const hasPII = piiDetected.length > 0;

  let riskScore = 0;
  if (hasSecrets) riskScore += 60;
  if (isPromptInjection) riskScore += 50;
  if (hasPII) riskScore += 30;

  riskScore = Math.min(100, riskScore);

  let privacyRecommendedAction: SecurityScanResult["privacyRecommendedAction"] = "proceed";
  if (hasSecrets) privacyRecommendedAction = "local_only";
  else if (isPromptInjection) privacyRecommendedAction = "sanitize";
  else if (hasPII) privacyRecommendedAction = "sanitize";

  return {
    hasSecrets,
    secretsDetected,
    hasPII,
    piiDetected,
    isPromptInjection,
    riskScore,
    isSafe: riskScore < 50,
    privacyRecommendedAction,
  };
}

export function sanitizePromptSecurity(input: string): string {
  if (!input) return "";

  return input
    // Mask API keys & secrets
    .replace(/sk-proj-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/sk-or-v1-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/nvapi-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/sk-ant-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/g, "[REDACTED_TOKEN]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_KEY]")
    .replace(/\b(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}\b/g, "[REDACTED_STRIPE_KEY]")
    .replace(/\bAIza[0-9A-Za-z\-_]{35}\b/g, "[REDACTED_GCP_KEY]")
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/gi, "[REDACTED_DB_URL]")
    .replace(/\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g, "[REDACTED_JWT]")
    .replace(/password\s*[:=]\s*['"][^'"]+['"]/gi, "password: '[REDACTED]'")
    // Mask emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // Mask phone numbers
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[REDACTED_PHONE]")
    // Strip injection markers
    .replace(/\[system override\]/gi, "")
    .replace(/ignore (all )?previous instructions/gi, "")
    .trim();
}
