import { describe, expect, it } from "vitest";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync("extension/lib/inspector.js", "utf8");

type Result = { empty: boolean; gaps: { id: string; label: string }[]; vague: string[] };
type Inspector = {
  check(text: string): Result;
  summarise(result: Result): string;
  details(result: Result): string;
};
const load = (): Inspector => vm.runInNewContext(`${source}\nPromptPlusInspector`, {});
const ids = (r: Result) => r.gaps.map((g) => g.id);

describe("prompt quality inspector", () => {
  it("says nothing about an empty draft", () => {
    const { check, summarise } = load();
    for (const blank of ["", "   ", "\n\t "]) {
      const result = check(blank);
      expect(result.empty).toBe(true);
      expect(result.gaps).toEqual([]);
      expect(summarise(result)).toBe("");
    }
  });

  it("reports what a bare fragment does not say", () => {
    const { check } = load();
    const result = check("login page");
    // No imperative, no named deliverable, no size, no boundary.
    expect(ids(result)).toContain("action");
    expect(ids(result)).toContain("format");
    expect(ids(result)).toContain("limit");
  });

  it("clears a draft that states each of the five things", () => {
    const { check, summarise } = load();
    const result = check(
      "Write a JSON schema for our existing Postgres users table, no more than 50 lines, and do not change column names."
    );
    expect(result.gaps).toEqual([]);
    expect(summarise(result)).toBe("specific and scoped");
  });

  it("counts a stated format, size and boundary as answered", () => {
    const { check } = load();
    expect(ids(check("Summarise this markdown file in under 100 words"))).not.toContain("format");
    expect(ids(check("Summarise this markdown file in under 100 words"))).not.toContain("limit");
    expect(ids(check("Refactor this, but avoid new dependencies"))).not.toContain("boundary");
  });

  it("does not treat a bare 'project' or 'we' as background", () => {
    const { check } = load();
    // The false-negative trap: matching these would call a context-free prompt
    // contextual.
    expect(ids(check("Write a project update"))).toContain("background");
    expect(ids(check("Write the code we need"))).toContain("background");
    expect(ids(check("Write it in React"))).not.toContain("background");
  });

  it("names the words standing in for a decision", () => {
    const { check, summarise } = load();
    const result = check("Make the dashboard look modern and clean");
    expect(result.vague).toContain("modern");
    // "clean" is also on the list, and neither is deduplicated away.
    expect(result.vague).toContain("clean");
    expect(summarise(result)).toContain("vague wording");
  });

  it("survives repeated calls despite the global regexes", () => {
    const { check } = load();
    const first = check("Make it modern").vague;
    const second = check("Make it modern").vague;
    expect(second).toEqual(first);
    expect(first).toEqual(["modern"]);
  });

  it("keeps the footer line short but never hides the full list", () => {
    const { check, summarise, details } = load();
    const result = check("login page");
    const line = summarise(result);
    // One named gap plus a count, not every label.
    expect(line).toMatch(/^\S.*· \+\d+$/);
    for (const gap of result.gaps) expect(details(result)).toContain(gap.label);
  });
});
