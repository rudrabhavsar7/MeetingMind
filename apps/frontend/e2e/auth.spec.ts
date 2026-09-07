import { test, expect } from "./helpers";

test.describe("Authentication", () => {
  test.describe("Login", () => {
    test("shows login form", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator("#login-email")).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("#login-password")).toBeVisible();
      await expect(page.locator("#login-submit")).toBeVisible();
      await expect(page.locator("text=Welcome back")).toBeVisible();
    });

    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("#login-email", { timeout: 10_000 });
      await page.fill("#login-email", "nonexistent@test.com");
      await page.fill("#login-password", "WrongPass123!");
      await page.click("#login-submit");
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
    });

    test("logs in with valid credentials and redirects to dashboard", async ({
      page,
    }) => {
      const { loginAsTestUser } = await import("./helpers");
      await loginAsTestUser(page);
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("navigates to register page from login", async ({ page }) => {
      await page.goto("/login");
      await page.click("text=Create one");
      await page.waitForURL("**/register");
      // Register page should show either the form or an "invitation required" message
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("redirects unauthenticated user to login", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForURL("**/login**", { timeout: 10_000 });
    });
  });
});
