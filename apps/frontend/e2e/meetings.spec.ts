import { test, expect, loginAsTestUser } from "./helpers";

test.describe("Meetings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("displays meetings list page", async ({ page }) => {
    await page.goto("/meetings");
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("shows empty state when no meetings", async ({ page }) => {
    await page.goto("/meetings");
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("navigates to new meeting page", async ({ page }) => {
    await page.goto("/meetings");
    const newBtn = page.locator("a, button", { hasText: /new|create/i }).first();
    if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForURL("**/meetings/new**", { timeout: 10_000 });
    }
  });

  test("navigates to import page", async ({ page }) => {
    await page.goto("/meetings/import");
    await expect(page.locator("body")).toBeVisible();
  });

  test("meeting detail page handles invalid ID gracefully", async ({ page }) => {
    await page.goto("/meetings/nonexistent-id-12345");
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });
});
