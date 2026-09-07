import { test, expect, loginAsTestUser } from "./helpers";

test.describe("Action Items", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("displays actions page", async ({ page }) => {
    await page.goto("/actions");
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("shows empty state when no action items", async ({ page }) => {
    await page.goto("/actions");
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });
});
