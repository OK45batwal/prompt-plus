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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  errors.push("❌ DATABASE_URL environment variable is missing.");
} else {
  console.log(`✅ DATABASE_URL is configured (${dbUrl.startsWith("file:") ? "SQLite" : "PostgreSQL/Neon"}).`);
}

const resendKey = process.env.RESEND_API_KEY;
if (resendKey) {
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpFrom) {
    warnings.push("⚠️ RESEND_API_KEY is set but SMTP_FROM is missing. Emails will use the test domain @resend.dev — real deliveries will fail.");
  } else if (smtpFrom.includes("@resend.dev")) {
    warnings.push("⚠️ SMTP_FROM uses @resend.dev (test domain). Set it to a domain verified in your Resend dashboard for production email delivery.");
  }
  console.log("✅ Resend email is configured.");
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
