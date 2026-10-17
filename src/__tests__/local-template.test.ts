import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

it("keeps the extension offline formatter explicit without discarding intent", () => {
  const context = { PromptPlusSynthesis: undefined as undefined | { synthesizeLocalPrompt: (text: string, options: object) => string } };
  vm.runInNewContext(readFileSync("extension/lib/synthesize.js", "utf8"), context);
  const text = 'Write exactly "done". Do not add Markdown.';
  const browser = context.PromptPlusSynthesis!.synthesizeLocalPrompt(text, { level: "deep" });
  expect(browser).toContain(text);
  expect(context.PromptPlusSynthesis!.synthesizeLocalPrompt("   ", {})).toBe("");
});
