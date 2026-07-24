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
});
