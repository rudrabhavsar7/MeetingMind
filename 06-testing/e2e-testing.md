---
Title: MeetingMind — Testing: End-to-End (E2E) Testing
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: 06-testing/testing-strategy.md
---

# MeetingMind Testing: E2E Testing

## 1. Overview
End-to-End (E2E) testing verifies the entire application stack—from the browser UI, through the network, to the API, Database, and Background workers—exactly as a user would experience it.

## 2. Tools
* **Framework:** Playwright (preferred over Cypress for its better multi-tab, iframe, and WebKit support).
* **Environment:** E2E tests should be run against a fully provisioned Staging environment.

## 3. Scope of E2E Tests
E2E tests are slow and brittle. They should *only* cover critical user journeys (the "Happy Path"). Edge cases should be handled by Unit/Integration tests.

### Critical Journeys for MeetingMind:
1. User Registration & Login.
2. Uploading a Meeting Video.
3. Viewing a completed transcript and summary.
4. Asking a RAG question in the Chat UI.

## 4. Writing Playwright Tests

### 4.1 Locators
Never use fragile CSS selectors (like `.div > span:nth-child(2)`).
* Prefer `getByRole` (e.g., `getByRole('button', { name: 'Submit' })`).
* Prefer `getByText`.
* If necessary, add `data-testid="upload-button"` to the React components.

### 4.2 Example: The Upload Flow
```typescript
import { test, expect } from '@playwright/test';

test('User can upload a meeting and view it', async ({ page }) => {
  // 1. Login (Usually handled via a global setup or fixture)
  await page.goto('https://staging.meetingmind.app/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 2. Navigate to Upload
  await page.click('text="New Meeting"');
  
  // 3. Upload File
  // Playwright can intercept file inputs specifically
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample_meeting.mp4');
  
  // 4. Wait for processing (This is the tricky part of E2E)
  // We expect to see a processing screen
  await expect(page.locator('text="Transcribing audio"')).toBeVisible();
  
  // Wait up to 2 minutes for processing to finish
  await expect(page.locator('text="Summary"')).toBeVisible({ timeout: 120000 });
  
  // 5. Verify Content
  await expect(page.locator('text="Action Items"')).toBeVisible();
});
```

## 5. Handling AI Non-Determinism
In the example above, we assert that the text "Summary" and "Action Items" are visible (the UI headers). We do *not* assert the exact text of the summary (e.g., `expect(page.locator('text="Alex approved the budget"')).toBeVisible()`), because the LLM might phrase it differently ("The budget was approved by Alex") and break the test.

## 6. Execution Strategy
* Run E2E tests nightly.
* Record video artifacts of failed tests for easy debugging.
* Playwright supports parallel execution; utilize it to keep the suite under 15 minutes.
