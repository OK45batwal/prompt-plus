import { describe, it, expect } from "vitest";
import { paginationSchema } from "@/lib/validations/common";
import {
  createPromptSchema,
  analyzePromptSchema,
  scorePromptSchema,
  enhancePromptSchema,
} from "@/lib/validations/prompts";
import { createCollectionSchema } from "@/lib/validations/collections";

describe("Validation Schemas", () => {
  describe("paginationSchema", () => {
    it("should accept valid page and pageSize", () => {
      const result = paginationSchema.safeParse({ page: "2", pageSize: "50", search: "test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(50);
        expect(result.data.search).toBe("test");
      }
    });

    it("should reject pageSize exceeding 100", () => {
      const result = paginationSchema.safeParse({ page: "1", pageSize: "500" });
      expect(result.success).toBe(false);
    });

    it("should reject negative or zero page number", () => {
      const result = paginationSchema.safeParse({ page: "0" });
      expect(result.success).toBe(false);
    });
  });

  describe("createPromptSchema", () => {
    it("should validate valid prompt input", () => {
      const result = createPromptSchema.safeParse({
        originalText: "Write a blog post about Next.js",
        model: "gpt-4",
        category: "Blog Post",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing originalText", () => {
      const result = createPromptSchema.safeParse({ model: "gpt-4" });
      expect(result.success).toBe(false);
    });

    it("should reject missing model", () => {
      const result = createPromptSchema.safeParse({ originalText: "Hello world" });
      expect(result.success).toBe(false);
    });
  });

  describe("analyzePromptSchema & scorePromptSchema", () => {
    it("should require text", () => {
      expect(analyzePromptSchema.safeParse({ text: "" }).success).toBe(false);
      expect(scorePromptSchema.safeParse({ text: "" }).success).toBe(false);
      expect(analyzePromptSchema.safeParse({ text: "Valid text" }).success).toBe(true);
      expect(scorePromptSchema.safeParse({ text: "Valid text" }).success).toBe(true);
    });
  });

  describe("enhancePromptSchema", () => {
    it("should parse valid enhance request", () => {
      const result = enhancePromptSchema.safeParse({
        text: "Make this better",
        model: "claude-3",
        provider: "anthropic",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid provider", () => {
      const result = enhancePromptSchema.safeParse({
        text: "Make this better",
        provider: "invalid_provider",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createCollectionSchema", () => {
    it("should require a valid name", () => {
      expect(createCollectionSchema.safeParse({ name: "" }).success).toBe(false);
      expect(createCollectionSchema.safeParse({ name: "Work Prompts" }).success).toBe(true);
    });
  });

  describe("detectProviderFromKey", () => {
    it("should auto-detect provider key prefixes accurately", async () => {
      const { detectProviderFromKey } = await import("@/lib/llm/providers");
      expect(detectProviderFromKey("nvapi-12345")).toBe("nvidia");
      expect(detectProviderFromKey("sk-or-v1-abcdef")).toBe("openrouter");
      expect(detectProviderFromKey("sk-ant-api03-xyz")).toBe("anthropic");
      expect(detectProviderFromKey("sk-proj-999")).toBe("openai");
      expect(detectProviderFromKey("sk-123456")).toBe("openai");
      expect(detectProviderFromKey("", "custom_fallback")).toBe("custom_fallback");
    });
  });
});
