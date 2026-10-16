import { test, expect, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function session(page: Page) {
  const name = "authjs.session-token";
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-secret-fallback-key-32chars";
  const value = await encode({ token: { id: "browser-fixture", sub: "browser-fixture", email: "fixture@example.test", name: "Test workspace" }, secret, salt: name });
  await page.context().addCookies([{ name, value, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/v1/**", route => route.fulfill({ json: { data: [] } }));
}

test("marketing demo starts empty and reports errors instead of substituting a sample", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your result will appear here after you enhance a prompt.")).toBeVisible();
  await page.route("**/api/v1/extension/enhance", route => route.fulfill({ status: 503, json: { error: "Provider temporarily unavailable" } }));
  await page.getByRole("textbox", { name: "Prompt to enhance" }).fill("Write an update for my team");
  await page.getByRole("button", { name: "Enhance Prompt Live" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Provider temporarily unavailable" })).toContainText("Provider temporarily unavailable");
  await expect(page.getByText("No model run yet")).toBeVisible();
});

test("fresh analytics has empty measurements on mobile and desktop", async ({ page }, info) => {
  await session(page);
  await page.route("**/api/v1/analytics/stats?**", route => route.fulfill({ json: { data: {
    kpis: { totalPrompts: 0, totalEnhancements: 0, averageScore: null, scoresMeasured: 0, scoreLift: null, pairedScores: 0, avgLatencyMs: null, totalTokens: 0 },
    dailyActivity: [], modelBreakdown: [], categoryBreakdown: [], recentLogs: [],
  } } }));
  await page.goto("/dashboard/analytics");
  await expect(page.getByText("No scored prompts yet")).toBeVisible();
  await expect(page.getByText("Your first prompt starts the story")).toBeVisible();
  await expect(page.getByLabel("Workspace metrics")).not.toContainText("92");
  await page.screenshot({ path: info.outputPath("analytics-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("main").getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("analytics-mobile.png"), fullPage: true });
});

test("Studio shows genuine zero assessments and an inconclusive verification without a winner", async ({ page }, info) => {
  await session(page);
  let mode: string | undefined;
  await page.route("**/api/v2/optimize", route => {
    mode = route.request().postDataJSON().mode;
    return route.fulfill({ json: { data: { source: "llm", selectedCandidate: { renderedText: "Return only 4.", id: "c" }, candidates: [], intent: { domain: "math", taskType: "answer", complexity: "simple", assumptions: [], unknowns: [] }, security: { isSafe: true, hasSecrets: false, hasPII: false } } } });
  });
  await page.route("**/api/v1/prompts", route => route.fulfill({ json: { data: { id: "saved-prompt" } } }));
  await page.route("**/api/v1/prompts/saved-prompt", route => route.fulfill({ json: { data: { id: "saved-prompt" } } }));
  await page.route("**/api/v1/prompts/score", route => route.fulfill({ json: { data: { source: "llm", total: 0, originalTotal: 0 } } }));
  let evaluationBody: Record<string, unknown> = {};
  await page.route("**/api/v2/evaluate", route => {
    evaluationBody = route.request().postDataJSON();
    return route.fulfill({ json: { data: { status: "inconclusive", winner: null, improvementDelta: null, baselineScore: null, optimizedScore: null, originalOutput: "4", optimizedOutput: "4", runs: [{ model: "model-a", provider: "fixture" }, { model: "model-b", provider: "fixture" }] } } });
  });
  await page.goto("/dashboard/new");
  await page.getByRole("textbox", { name: "Your prompt", exact: true }).fill('What is 2+2? Return only "4"');
  await page.getByRole("button", { name: "Enhance Prompt", exact: true }).click();
  await expect(page.getByText("→ Enhanced: 0/100")).toBeVisible();
  expect(mode).toBe("api");
  await page.getByRole("button", { name: "Verify with live models" }).click();
  await expect(page.getByText("The runs used different models or providers. No winner can be reported.")).toBeVisible();
  expect(evaluationBody).toMatchObject({ confirmLiveEvaluation: true, rubric: { exact: "4" }, promptId: "saved-prompt" });
  await page.screenshot({ path: info.outputPath("studio-verification.png"), fullPage: true });
});
