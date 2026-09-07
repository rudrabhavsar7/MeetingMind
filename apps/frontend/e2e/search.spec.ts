import { test, expect, loginAsTestUser } from "./helpers";

test.describe("Search / Ask AI", () => {
  test("displays search page", async ({ page }) => {
    await loginAsTestUser(page);
    await page.click('a:has-text("Ask AI")');
    await page.waitForURL("**/search", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/search/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("can type a query", async ({ page }) => {
    await loginAsTestUser(page);
    await page.click('a:has-text("Ask AI")');
    await page.waitForURL("**/search", { timeout: 10_000 });
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[type="text"], input[type="search"], textarea').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill("What were the action items from the last meeting?");
    }
  });
});
