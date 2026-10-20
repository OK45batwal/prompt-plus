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
