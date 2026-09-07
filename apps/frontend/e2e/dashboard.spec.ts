import { test, expect, loginAsTestUser } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("displays dashboard page", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("shows sidebar navigation", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Meetings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Actions" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask AI" })).toBeVisible();
  });

  test("navigates to meetings page", async ({ page }) => {
    await page.click("text=Meetings");
    await page.waitForURL("**/meetings");
    await expect(page).toHaveURL(/\/meetings/);
  });

  test("navigates to actions page", async ({ page }) => {
    await page.click("text=Actions");
    await page.waitForURL("**/actions");
    await expect(page).toHaveURL(/\/actions/);
  });

  test("navigates to search page", async ({ page }) => {
    await page.click("text=Ask AI");
    await page.waitForURL("**/search");
    await expect(page).toHaveURL(/\/search/);
  });

  test("navigates to profile settings", async ({ page }) => {
    await page.click("text=Profile");
    await page.waitForURL("**/settings/profile");
    await expect(page).toHaveURL(/\/settings\/profile/);
  });
});
