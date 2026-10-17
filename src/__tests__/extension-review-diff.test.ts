import { describe, expect, it } from "vitest";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync("extension/lib/diff.js", "utf8");

type Diff = { before: string; after: string; changed: boolean };
const load = (): { escapeHtml(value: unknown): string; highlight(a: string, b: string): Diff } =>
  vm.runInNewContext(`${source}\nPromptPlusDiff`, {});

describe("shared review diff", () => {
  it("marks nothing when the prompt is unchanged", () => {
    const { highlight } = load();
    const result = highlight("Write a project update", "Write a project update");
    expect(result.changed).toBe(false);
    expect(result.before).toBe(result.after);
    expect(result.before).not.toContain("<del>");
    expect(result.before).not.toContain("<ins>");
  });

  it("keeps the original text intact when the compiler embeds it in scaffolding", () => {
    const { highlight } = load();
    // The deterministic engine wraps the raw prompt in ### sections. A common
    // prefix/suffix pass alone would mark the whole original as deleted.
    const result = highlight(
      "write a launch email",
      "### Task\n\nwrite a launch email\n\n### Instructions\n\nBe concise."
    );
    expect(result.changed).toBe(true);
    expect(result.before).not.toContain("write a launch email</del>");
    expect(result.before).toContain("write a launch email");
    expect(result.after).toContain("<ins>### Task");
  });

  it("escapes markup on both sides rather than injecting it", () => {
    const { highlight, escapeHtml } = load();
    const result = highlight("<img src=x onerror=alert(1)>", "keep <b>bold</b>");
    expect(result.before).toContain("&lt;img");
    expect(result.before).not.toContain("<img");
    expect(result.after).not.toContain("<b>bold</b>");
    expect(result.after).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml('a"b')).toBe("a&quot;b");
  });

  it("handles empty input and falls back past the LCS cell ceiling", () => {
    const { highlight } = load();
    expect(highlight("", "")).toEqual({ before: "", after: "", changed: false });
    expect(highlight("", "added")).toEqual({ before: "", after: "<ins>added</ins>", changed: true });
    // 1000 x 1000 tokens is over MAX_LCS_CELLS, so the linear path must run.
    const big = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(" ");
    const result = highlight(big, `${big} tail`);
    expect(result.changed).toBe(true);
    expect(result.before).toBe(big);
    expect(result.before).not.toContain("<del>");
    expect(result.after).toBe(`${big}<ins> tail</ins>`);
  });
});
