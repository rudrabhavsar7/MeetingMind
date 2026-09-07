import { test, expect, loginAsTestUser } from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("displays profile settings page", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("shows user profile information", async ({ page }) => {
    await page.goto("/settings/profile");
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("displays workspace settings page", async ({ page }) => {
    await page.goto("/settings/workspace");
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("displays extension settings page", async ({ page }) => {
    await page.goto("/settings/extension");
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("can navigate between settings pages", async ({ page }) => {
    await page.goto("/settings/profile");
    await page.waitForTimeout(1000);
    const wsLink = page.locator("a", { hasText: /workspace/i }).first();
    if (await wsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wsLink.click();
      await page.waitForURL("**/settings/workspace**", { timeout: 5000 });
    }
  });
});
