import { describe, it, expect } from "vitest";
import { autocorrectText } from "@/lib/prompt-engine/autocorrect";

describe("AutoCorrect & Typos Normalizer Engine", () => {
  it("should normalize developer and technical typos correctly", () => {
    const input = "imrpove prompt respons for python web scrpaer and react compnent";
    const result = autocorrectText(input);

    expect(result.correctionsCount).toBeGreaterThan(0);
    expect(result.correctedText).toBe("improve prompt response for python web scraper and react component");
  });

  it("should preserve title casing and capital letters", () => {
    const input = "Imrpove react Compnent and Secutiy";
    const result = autocorrectText(input);

    expect(result.correctedText).toBe("Improve react Component and Security");
  });

  it("should handle clean input without modifying correctly spelled words", () => {
    const input = "Create a Next.js 16 API route with Zod validation.";
    const result = autocorrectText(input);

    expect(result.correctionsCount).toBe(0);
    expect(result.correctedText).toBe(input);
  });
});
