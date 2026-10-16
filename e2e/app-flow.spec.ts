import { test, expect } from "@playwright/test";

test.describe("Prompt+ End-to-End User Flow", () => {
  test("Landing Page renders with main headline and CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Prompt\+/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
  });

  test("Private API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/v1/prompts");
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
  });

  test("Template dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard/templates");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("Login & Signup pages render cleanly with auth options", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Email address/i)).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Create Account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Full Name/i)).toBeVisible();
  });
});
