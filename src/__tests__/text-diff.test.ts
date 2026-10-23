import { describe, expect, it } from "vitest";
import { diffWords } from "@/lib/text-diff";

const joined = (tokens: { value: string; changed: string }[]) => tokens.map((t) => t.value).join("");

describe("diffWords", () => {
  it("marks nothing when the text is unchanged", () => {
    const tokens = diffWords("Keep this prompt", "Keep this prompt");
    expect(tokens.every((t) => t.changed === "none")).toBe(true);
  });

  it("marks only changed words and preserves both texts", () => {
    const before = "Write a short blog post about TypeScript";
    const after = "Write a concise blog post about TypeScript generics";
    const tokens = diffWords(before, after);

    expect(tokens.filter((t) => t.changed === "removed" && t.value.trim()).map((t) => t.value)).toEqual(["short"]);
    expect(tokens.filter((t) => t.changed === "added" && t.value.trim()).map((t) => t.value)).toEqual(["concise", "generics"]);
    expect(joined(tokens.filter((t) => t.changed !== "added"))).toBe(before);
    expect(joined(tokens.filter((t) => t.changed !== "removed"))).toBe(after);
  });

  it("does not drop whitespace", () => {
    const tokens = diffWords("a\nb", "a\nc");
    expect(joined(tokens.filter((t) => t.changed !== "added"))).toBe("a\nb");
  });

  it("falls back to a block replace for oversized inputs instead of allocating a huge table", () => {
    const a = Array.from({ length: 2200 }, (_, i) => `a${i}`).join(" ");
    const b = Array.from({ length: 2200 }, (_, i) => `b${i}`).join(" ");
    const tokens = diffWords(a, b);
    expect(tokens.every((t) => t.changed === "removed" || t.changed === "added")).toBe(true);
    expect(joined(tokens.filter((t) => t.changed !== "added"))).toBe(a);
    expect(joined(tokens.filter((t) => t.changed !== "removed"))).toBe(b);
  });
});
