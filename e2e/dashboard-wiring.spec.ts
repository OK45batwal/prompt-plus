import { test, expect, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function session(page: Page) {
  const name = "authjs.session-token";
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-secret-fallback-key-32chars";
  const value = await encode({ token: { id: "browser-fixture", sub: "browser-fixture", email: "fixture@example.test", name: "Test workspace", authVersion: 0 }, secret, salt: name });
  await page.context().addCookies([{ name, value, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.route("**/api/v1/**", route => route.fulfill({ json: { data: [] } }));
}

// The Library and History "reuse" links and the extension's Web Studio handoff all pass
// the prompt in the query string. The Studio used to ignore it and open empty.
test("Studio hydrates the prompt from handoff query params", async ({ page }) => {
  await session(page);
  await page.route("**/api/v1/prompts/saved-123", route =>
    route.fulfill({ json: { data: { id: "saved-123", originalText: "REFACTOR MY SCRAPER" } } })
  );

  const promptBox = page.getByRole("textbox", { name: "What do you want the AI to do?", exact: true });

  await page.goto("/dashboard/new?prompt=hello%20from%20the%20extension");
  await expect(promptBox).toHaveValue("hello from the extension");

  await page.goto("/dashboard/new?promptId=saved-123");
  await expect(promptBox).toHaveValue("REFACTOR MY SCRAPER");
});

// The favorite column and the star have always existed, but nothing could ever write
// isFavorite, so the star could never light up.
test("Library favorite star persists through PATCH", async ({ page }) => {
  await session(page);
  await page.route("**/api/v1/prompts?**", route =>
    route.fulfill({ json: { data: [{
      id: "p1",
      title: "My saved prompt",
      originalText: "Do the thing",
      model: "gpt-4o",
      category: "Code",
      score: 80,
      isFavorite: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    }] } })
  );
  let patched: unknown = null;
  await page.route("**/api/v1/prompts/p1", route => {
    if (route.request().method() === "PATCH") patched = route.request().postDataJSON();
    return route.fulfill({ json: { data: { id: "p1" } } });
  });

  await page.goto("/dashboard/library");
  await page.getByRole("button", { name: "Add to favorites" }).click();
  await expect(page.getByRole("button", { name: "Remove from favorites" })).toBeVisible();
  expect(patched).toMatchObject({ isFavorite: true });
});

test("Library displays tags, filters by tag pills, and updates tags via modal", async ({ page }) => {
  await session(page);
  await page.route("**/api/v1/prompts?**", route =>
    route.fulfill({ json: { data: [
      {
        id: "p1",
        title: "Web Scraper",
        originalText: "Scrape async",
        model: "gpt-4o",
        category: "Code",
        tags: "python, crawler",
        score: 85,
        isFavorite: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "p2",
        title: "API Endpoint",
        originalText: "Create Next.js route",
        model: "claude-3-5-sonnet",
        category: "Code",
        tags: "typescript, api",
        score: 90,
        isFavorite: false,
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ] } })
  );

  let patchedTags: unknown = null;
  await page.route("**/api/v1/prompts/p1", route => {
    if (route.request().method() === "PATCH") patchedTags = route.request().postDataJSON();
    return route.fulfill({ json: { data: { id: "p1", tags: "python, crawler, verified" } } });
  });

  await page.goto("/dashboard/library");
  await expect(page.getByText("#python").first()).toBeVisible();
  await expect(page.getByText("#crawler").first()).toBeVisible();

  // Filter by tag
  await page.getByRole("button", { name: /#python/i }).first().click();
  await expect(page.getByText("Web Scraper")).toBeVisible();
  await expect(page.getByText("API Endpoint")).not.toBeVisible();

  // Reset filter
  await page.getByRole("button", { name: /^all/i }).first().click();
  await expect(page.getByText("API Endpoint")).toBeVisible();

  // Open Tag Editor on Web Scraper
  await page.locator("div.p-4").filter({ hasText: "Web Scraper" }).getByRole("button", { name: "Manage tags" }).click();
  await expect(page.getByRole("heading", { name: "Manage Prompt Tags" })).toBeVisible();
  await page.getByPlaceholder(/e\.g\. frontend/i).fill("python, crawler, verified");
  const patchPromise = page.waitForRequest(req => req.url().includes("/api/v1/prompts/p1") && req.method() === "PATCH");
  await page.getByRole("button", { name: "Save Tags" }).click();
  await patchPromise;
  expect(patchedTags).toMatchObject({ tags: "python, crawler, verified" });
});
