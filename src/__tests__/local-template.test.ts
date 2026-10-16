import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { synthesizeAlgorithmicPrompt } from "@/lib/llm/algorithmic-enhancers";

it("uses the same offline formatter in the browser and server without discarding intent", () => {
  const context = { PromptPlusSynthesis: undefined as undefined | { synthesizeLocalPrompt: (text: string, options: object) => string } };
  vm.runInNewContext(readFileSync("extension/lib/synthesize.js", "utf8"), context);
  const text = 'Write exactly "done". Do not add Markdown.';
  const browser = context.PromptPlusSynthesis!.synthesizeLocalPrompt(text, { level: "deep" });
  expect(browser).toBe(synthesizeAlgorithmicPrompt(text));
  expect(browser).toContain(text);
  expect(synthesizeAlgorithmicPrompt("   ")).toBe("");
});
