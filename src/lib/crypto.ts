import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getSecretKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error(
        "FATAL: ENCRYPTION_KEY must be set in production environment variables and be at least 32 characters long."
      );
    }
    return crypto.createHash("sha256").update(secret).digest();
  }

  const devSecret = secret || "dev-only-secret-key-prompt-plus-32-bytes!";
  return crypto.createHash("sha256").update(devSecret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: iv_hex:ciphertext_hex:auth_tag_hex
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

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
  const key = getSecretKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
