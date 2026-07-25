import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn().mockImplementation(() => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

import { encrypt, decrypt } from "@/lib/crypto";
import { getProviders } from "@/lib/auth/config";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { hasPermission } from "@/lib/auth/permissions";
import { NextRequest } from "next/server";

describe("Phase 1 Security & Correctness Hardening", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Issue #1 & #5: OAuth Providers and Secret Checks", () => {
    it("should omit GitHub/Google providers when environment variables are missing", () => {
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const providers = getProviders();
      expect(providers).toHaveLength(1); // Credentials only
      expect((providers[0] as { id: string }).id).toBe("credentials");
    });

    it("should include GitHub provider when environment variables are set", () => {
      process.env.GITHUB_CLIENT_ID = "test-gh-id";
      process.env.GITHUB_CLIENT_SECRET = "test-gh-secret";
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const providers = getProviders();
      const providerIds = providers.map((p) => (p as { id: string }).id);
      expect(providerIds).toContain("github");
      expect(providerIds).toContain("credentials");
    });
  });

  describe("Issue #4: Encryption Key Production Strictness", () => {
    it("should throw in production if ENCRYPTION_KEY is unset or too short", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt("secret-data")).toThrow(
        "FATAL: ENCRYPTION_KEY must be set in production environment variables"
      );
    });

    it("should work in development mode with fallback key", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      delete process.env.ENCRYPTION_KEY;

      const encrypted = encrypt("secret-data");
      expect(encrypted).toContain(":");
      expect(decrypt(encrypted)).toBe("secret-data");
    });

    it("should work in production if valid 32-character key is supplied", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";

      const encrypted = encrypt("prod-secret-data");
      expect(decrypt(encrypted)).toBe("prod-secret-data");
    });
  });

  describe("Issue #3: Rate Limiting & Bucket Eviction", () => {
    it("should correctly track rate limit per user and enforce daily quota", () => {
      resetRateLimit("user-rate-test-1");

      const res1 = checkRateLimit("user-rate-test-1", 15);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(5);

      const res2 = checkRateLimit("user-rate-test-1", 6);
      expect(res2.allowed).toBe(false);
      expect(res2.remaining).toBe(0);
    });
  });

  describe("Issue #6: CSRF Protection", () => {
    it("should allow safe HTTP GET requests without anti-CSRF headers", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", { method: "GET" });
      const result = validateCsrf(req);
      expect(result.valid).toBe(true);
    });

    it("should reject state-changing POST requests missing custom headers/json content-type", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", { method: "POST" });
      const result = validateCsrf(req);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Missing anti-CSRF protection headers");
    });

    it("should accept state-changing POST requests with application/json content-type", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost:3000" },
      });
      const result = validateCsrf(req);
      expect(result.valid).toBe(true);
    });

    it("should reject POST requests when Origin hostname does not match Host header", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "localhost:3000",
          origin: "http://evil-attacker.com",
        },
      });
      const result = validateCsrf(req);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("CSRF origin mismatch");
    });
  });

  describe("Issue #7: Permission Checks", () => {
    it("should grant access if user owns the resource", () => {
      const session = { user: { id: "user-123", role: "user" }, expires: "2099-01-01" };
      expect(hasPermission(session, "user", "user-123")).toBe(true);
    });

    it("should deny access if user does not own the resource", () => {
      const session = { user: { id: "user-123", role: "user" }, expires: "2099-01-01" };
      expect(hasPermission(session, "user", "user-456")).toBe(false);
    });

    it("should grant admin full access to any resource", () => {
      const session = { user: { id: "admin-1", role: "admin" }, expires: "2099-01-01" };
      expect(hasPermission(session, "admin", "user-456")).toBe(true);
    });
  });
});
