import fs from "fs";
import path from "path";

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

console.log("🔍 Checking deployment environment readiness...\n");

const errors = [];
const warnings = [];

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!secret) {
  errors.push("❌ AUTH_SECRET or NEXTAUTH_SECRET environment variable is missing.");
} else if (secret.length < 32) {
  warnings.push("⚠️ AUTH_SECRET is less than 32 characters long. Recommend generating a 32+ char secret.");
} else {
  console.log("✅ AUTH_SECRET is configured.");
}

// Authentication and encryption secrets are validated independently: rotating the auth
// secret must not orphan stored API keys, which are encrypted with ENCRYPTION_KEY.
const encryptionKey = process.env.ENCRYPTION_KEY;
if (!encryptionKey) {
  errors.push("❌ ENCRYPTION_KEY environment variable is missing. Stored provider API keys cannot be encrypted.");
} else if (encryptionKey.length < 32) {
  errors.push("❌ ENCRYPTION_KEY must be at least 32 characters long.");
} else if (encryptionKey === secret) {
  warnings.push("⚠️ ENCRYPTION_KEY equals AUTH_SECRET. Use a distinct key so rotating one does not affect the other.");
} else {
  console.log("✅ ENCRYPTION_KEY is configured and separate from AUTH_SECRET.");
}

const dbUrl = process.env.DATABASE_URL;if (!dbUrl) {
  errors.push("❌ DATABASE_URL environment variable is missing.");
} else if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
  errors.push("DATABASE_URL must be a PostgreSQL URL; the runtime currently uses the Neon HTTP adapter.");
} else {
  console.log(`✅ DATABASE_URL is configured (${dbUrl.startsWith("file:") ? "SQLite" : "PostgreSQL/Neon"}).`);
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (process.env.NODE_ENV === "production" && (!redisUrl || !redisToken)) {
  errors.push("Production requires UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_URL/KV_REST_API_TOKEN pair the Vercel Upstash integration injects). Protected routes return 503 without distributed rate limiting.");
}

const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
if (smtpHost && smtpUser && smtpPass) {
  console.log("✅ SMTP email is configured.");
} else if (smtpHost || smtpUser || smtpPass) {
  warnings.push("⚠️ SMTP is partially configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable.");
}

const resendKey = process.env.RESEND_API_KEY;
if (resendKey && !smtpHost) {
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpFrom) {
    warnings.push("⚠️ RESEND_API_KEY is set but SMTP_FROM is missing. Emails will use the test domain @resend.dev — real deliveries will fail.");
  } else if (smtpFrom.includes("@resend.dev")) {
    warnings.push("⚠️ SMTP_FROM uses @resend.dev (test domain). Set it to a domain verified in your Resend dashboard for production email delivery.");
  }
  console.log("✅ Resend email is configured (fallback).");
} else if (!smtpHost && !resendKey) {
  warnings.push("⚠️ No email provider configured. Password reset emails will not work. Set SMTP_HOST+SMTP_USER+SMTP_PASS or RESEND_API_KEY.");
}

if (errors.length > 0) {
  console.error("\nDeployment environment check failed:");
  errors.forEach(e => console.error(e));
  process.exit(1);
}

if (warnings.length > 0) {
  warnings.forEach(w => console.warn(w));
}

console.log("\n🚀 Environment is ready for production deployment!");
