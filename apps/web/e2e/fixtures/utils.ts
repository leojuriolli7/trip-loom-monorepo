import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { DEFAULT_VALID_PASSWORD } from "./constants";

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

/**
 * Generates a unique test user using faker.
 * Email includes a UUID suffix to avoid conflicts in parallel test runs.
 */
export function generateTestUser(): TestUser {
  const uuid = faker.string.uuid().slice(0, 8);

  return {
    name: faker.person.fullName(),
    email: `test-${uuid}@example.com`,
    password: DEFAULT_VALID_PASSWORD,
  };
}

/**
 * Signs up a new user via the UI.
 * Returns the user credentials for later use.
 */
export async function signUpUser(
  page: Page,
  user?: TestUser,
): Promise<TestUser> {
  const testUser = user ?? generateTestUser();

  await page.goto("/enter");

  // Wait for page to be ready
  await page.waitForLoadState("networkidle");

  // Switch to sign-up mode
  await page.getByTestId("toggle-to-sign-up").click();

  // Wait for sign-up form to be visible
  await page.getByTestId("sign-up-name-input").waitFor({ state: "visible" });

  // Fill in the sign-up form
  await page.getByTestId("sign-up-name-input").fill(testUser.name);
  await page.getByTestId("sign-up-email-input").fill(testUser.email);
  await page.getByTestId("sign-up-password-input").fill(testUser.password);
  await page
    .getByTestId("sign-up-confirm-password-input")
    .fill(testUser.password);

  // Submit and wait for the sign-up API call to complete
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/auth/sign-up/email") &&
        res.request().method() === "POST",
    ),
    page.getByTestId("sign-up-submit").click(),
  ]);

  // Wait for redirect to dashboard
  await page.waitForURL("/", { timeout: 15000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle");

  return testUser;
}

/**
 * Signs in an existing user via the UI.
 */
export async function signInUser(
  page: Page,
  credentials: Pick<TestUser, "email" | "password">,
): Promise<void> {
  await page.goto("/enter");

  // Wait for page to be ready
  await page.waitForLoadState("networkidle");

  // Wait for the form to be ready
  await page.getByTestId("sign-in-email-input").waitFor({ state: "visible" });

  // Fill in the sign-in form
  await page.getByTestId("sign-in-email-input").fill(credentials.email);
  await page.getByTestId("sign-in-password-input").fill(credentials.password);

  // Submit and wait for the sign-in API call to complete
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/auth/sign-in/email") &&
        res.request().method() === "POST",
    ),
    page.getByTestId("sign-in-submit").click(),
  ]);

  // Wait for redirect to dashboard
  await page.waitForURL("/", { timeout: 15000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle");
}

/**
 * Signs out the current user via the UI.
 */
export async function signOutUser(page: Page): Promise<void> {
  // Click the user avatar to open dropdown
  await page.getByTestId("user-avatar-trigger").click();

  // Wait for dropdown to be visible
  await page.getByTestId("logout-button").waitFor({ state: "visible" });

  // Click logout and wait for signout API
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/auth/sign-out") &&
        res.request().method() === "POST",
    ),
    page.getByTestId("logout-button").click(),
  ]);

  // Wait for redirect to /enter
  await page.waitForURL("/enter", { timeout: 15000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle");
}

/**
 * Opens the user preferences dialog and waits for data to load.
 */
export async function openPreferencesDialog(page: Page): Promise<void> {
  // Ensure any previous dialog is closed
  const dialog = page.getByTestId("preferences-dialog");
  if (await dialog.isVisible()) {
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }

  // Click the user avatar to open dropdown
  await page.getByTestId("user-avatar-trigger").click();

  // Wait for menu to be visible
  await page.getByTestId("preferences-menu-item").waitFor({ state: "visible" });

  // Click the Profile menu item and wait for preferences API
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/user/preferences") &&
        res.request().method() === "GET",
    ),
    page.getByTestId("preferences-menu-item").click(),
  ]);

  // Wait for form to be visible
  await page.getByTestId("cabin-class-select").waitFor({
    state: "visible",
    timeout: 15000,
  });
}

/**
 * Saves user preferences and waits for the API call to complete.
 */
export async function savePreferences(page: Page): Promise<void> {
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/user/preferences") &&
        res.request().method() === "PUT",
    ),
    page.getByTestId("save-preferences-button").click(),
  ]);

  // Wait for dialog to close
  await page.getByTestId("preferences-dialog").waitFor({ state: "hidden" });
}
