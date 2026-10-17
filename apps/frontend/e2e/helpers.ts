import { test as base, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.API_URL ?? "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

const TEST_EMAIL = "t1@test.com";
const TEST_PASSWORD = "12345678";
const TEST_FULL_NAME = "Rudra Bhavsar";
const TEST_WORKSPACE = "test";

/**
 * Global setup: ensure a test user exists (register if bootstrap, login otherwise).
 * Returns the access token for API-level tests.
 */
async function ensureTestUser(api: APIRequestContext): Promise<string> {
  // Check bootstrap status
  const statusRes = await api.get(`${API_V1}/auth/bootstrap-status`);
  const statusBody = await statusRes.json();
  const setupRequired = statusBody.data?.setup_required ?? true;

  if (setupRequired) {
    // First user — bootstrap register
    const regRes = await api.post(`${API_V1}/auth/register`, {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULL_NAME,
        workspace_name: "E2E Test Workspace",
        workspace_slug: TEST_WORKSPACE,
      },
    });
    if (regRes.ok()) {
      const body = await regRes.json();
      return body.data.access_token;
    }
  }

  // User already exists — login
  const loginRes = await api.post(`${API_V1}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (loginRes.ok()) {
    const body = await loginRes.json();
    return body.data.access_token;
  }

  throw new Error(
    `Could not create or login test user. Bootstrap: ${setupRequired}, Login: ${loginRes.status()}`
  );
}

type TestFixtures = {
  apiToken: string;
};

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line react-hooks/rules-of-hooks
  apiToken: async ({}, callback) => {
    const apiContext = await pwRequest.newContext({ baseURL: API_BASE });
    const token = await ensureTestUser(apiContext);
    await callback(token);
    await apiContext.dispose();
  },
});

export { expect };

// Re-export helpers
export function uniqueEmail(prefix = "e2e"): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rand}@test.meetingmind`;
}

export async function isBackendUp(api: APIRequestContext): Promise<boolean> {
  try {
    const res = await api.get(`${API_BASE}/health`);
    return res.ok();
  } catch {
    return false;
  }
}

export async function loginAsTestUser(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.waitForSelector("#login-email", { timeout: 10_000 });
  await page.fill("#login-email", TEST_EMAIL);
  await page.fill("#login-password", TEST_PASSWORD);
  await page.click("#login-submit");
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export async function fillAndSubmitLogin(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.waitForSelector("#login-email", { timeout: 10_000 });
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click("#login-submit");
}

export async function fillAndSubmitRegister(
  page: import("@playwright/test").Page,
  data: {
    fullName: string;
    email: string;
    password: string;
    workspaceName: string;
    workspaceSlug: string;
  }
) {
  await page.goto("/register");
  await page.waitForSelector("#register-name", { timeout: 10_000 });
  await page.fill("#register-name", data.fullName);
  await page.fill("#register-email", data.email);
  await page.fill("#register-workspace", data.workspaceName);
  await page.fill("#register-workspace-slug", data.workspaceSlug);
  await page.fill("#register-password", data.password);
  await page.click("#register-submit");
}

export async function waitForAuthenticated(page: import("@playwright/test").Page) {
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10_000 });
}
