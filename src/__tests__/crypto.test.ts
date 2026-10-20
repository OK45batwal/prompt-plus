import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

describe("Crypto Helper (AES-256-GCM)", () => {
  it("should encrypt and decrypt a string correctly", () => {
    const originalText = "sk-proj-secret-api-key-1234567890";
    const encrypted = encrypt(originalText);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted).toContain(":");

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it("should produce different ciphertexts for identical plaintext due to random IV", () => {
    const text = "same-api-key-value";
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it("should throw error on invalid ciphertext format", () => {
    expect(() => decrypt("invalid-cipher-text")).toThrow("Invalid cipher text format");
  });

  it("should still decrypt ciphertext written with the legacy auth-secret fallback", async () => {
    const crypto = await import("node:crypto");
    const legacySecret = "legacy-auth-secret-that-is-long-enough-32";
    const previousAuth = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = legacySecret;

    // Emulate the pre-separation format: AES-256-GCM under the auth secret.
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash("sha256").update(legacySecret).digest();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = cipher.update("sk-or-v1-legacy", "utf8", "hex") + cipher.final("hex");
    const legacyValue = `${iv.toString("hex")}:${encrypted}:${cipher.getAuthTag().toString("hex")}`;

    expect(decrypt(legacyValue)).toBe("sk-or-v1-legacy");
    process.env.AUTH_SECRET = previousAuth;
  });
});
