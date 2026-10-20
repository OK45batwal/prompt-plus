import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEV_FALLBACK = "dev-only-secret-key-prompt-plus-32-bytes!";

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * The key used to write new ciphertext. Authentication and encryption secrets are
 * validated independently: rotating the auth secret must not silently orphan stored keys.
 */
function encryptionKey(): Buffer {
  const explicit = (process.env.ENCRYPTION_KEY || "").trim();
  if (explicit) {
    if (explicit.length < 32) {
      throw new Error("FATAL: ENCRYPTION_KEY must be at least 32 characters long.");
    }
    return deriveKey(explicit);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: ENCRYPTION_KEY must be set in production environment variables.");
  }
  return deriveKey(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || DEV_FALLBACK);
}

/**
 * Keys that may have produced existing ciphertext, newest policy first. The auth-secret
 * entries are legacy: encrypt() no longer uses them, but stored keys still decrypt.
 */
function decryptionKeys(): Buffer[] {
  const secrets = [
    process.env.ENCRYPTION_KEY,
    process.env.AUTH_SECRET,
    process.env.NEXTAUTH_SECRET,
    process.env.NODE_ENV === "production" ? undefined : DEV_FALLBACK,
  ]
    .map((value) => (value || "").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  return secrets.filter((secret) => (seen.has(secret) ? false : seen.add(secret))).map(deriveKey);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: iv_hex:ciphertext_hex:auth_tag_hex
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Input format: iv_hex:ciphertext_hex:auth_tag_hex
 */
export function decrypt(cipherTextWithIv: string): string {
  const parts = cipherTextWithIv.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid cipher text format");
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  for (const key of decryptionKeys()) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      // Wrong key for this ciphertext: try the next configured secret.
    }
  }

  throw new Error("Unable to decrypt stored value with the configured secrets");
}
