import { test, expect } from "@playwright/test";

test.describe("Prompt+ End-to-End User Flow", () => {
  test("Landing Page renders with main headline and CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Prompt\+/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start Building Free/i })).toBeVisible();
  });

  test("Health API Endpoint returns healthy status", async ({ page }) => {
    const response = await page.goto("/api/health");
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });

  test("Template Marketplace renders official templates and Export Code modal", async ({ page }) => {
    await page.goto("/dashboard/templates");
    await expect(page.getByText(/Template Marketplace/i)).toBeVisible();
    await expect(page.getByText(/High-Converting SEO Blog Article/i)).toBeVisible();

    // Click 'Code' export button on first template
    const codeBtn = page.getByRole("button", { name: /Code/i }).first();
    await codeBtn.click();
    await expect(page.getByText(/Export Code & Variables/i)).toBeVisible();
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
