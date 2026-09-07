import { test, expect, loginAsTestUser } from "./helpers";

test.describe("Full App Navigation", () => {
  test("complete user journey: login → dashboard → navigate all pages", async ({
    page,
  }) => {
    // Step 1: Login
    await loginAsTestUser(page);

    // Step 2: Dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 3: Navigate to Meetings
    await page.click("text=Meetings");
    await page.waitForURL("**/meetings");
    await expect(page).toHaveURL(/\/meetings/);

    // Step 4: Navigate to Actions
    await page.click("text=Actions");
    await page.waitForURL("**/actions");
    await expect(page).toHaveURL(/\/actions/);

    // Step 5: Navigate to Search
    await page.click("text=Ask AI");
    await page.waitForURL("**/search");
    await expect(page).toHaveURL(/\/search/);

    // Step 6: Navigate to Profile
    await page.click("text=Profile");
    await page.waitForURL("**/settings/profile");
    await expect(page).toHaveURL(/\/settings\/profile/);

    // Step 7: Back to Dashboard
    await page.click("text=Dashboard");
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await loginAsTestUser(page);
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) => !e.includes("401") && !e.includes("Failed to fetch") && !e.includes("NetworkError")
    );

    expect(criticalErrors).toEqual([]);
  });
});
