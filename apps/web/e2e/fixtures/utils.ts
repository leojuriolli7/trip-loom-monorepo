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
export async function signUpUser(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user ?? generateTestUser();

  await page.goto("/enter");

  // Switch to sign-up mode
  await page.getByTestId("toggle-to-sign-up").click();

  // Fill in the sign-up form
  await page.getByTestId("sign-up-name-input").fill(testUser.name);
  await page.getByTestId("sign-up-email-input").fill(testUser.email);
  await page.getByTestId("sign-up-password-input").fill(testUser.password);
  await page
    .getByTestId("sign-up-confirm-password-input")
    .fill(testUser.password);

  // Submit
  await page.getByTestId("sign-up-submit").click();

  // Wait for redirect to dashboard
  await page.waitForURL("/");

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

  // Fill in the sign-in form
  await page.getByTestId("sign-in-email-input").fill(credentials.email);
  await page.getByTestId("sign-in-password-input").fill(credentials.password);

  // Submit
  await page.getByTestId("sign-in-submit").click();

  // Wait for redirect to dashboard
  await page.waitForURL("/");
}

/**
 * Signs out the current user via the UI.
 */
export async function signOutUser(page: Page): Promise<void> {
  // Click the user avatar to open dropdown
  await page.getByTestId("user-avatar-trigger").click();

  // Click logout
  await page.getByTestId("logout-button").click();

  // Wait for redirect to /enter
  await page.waitForURL("/enter");
}
