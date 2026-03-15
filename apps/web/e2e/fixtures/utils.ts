import { faker } from "@faker-js/faker";
import type { Page, Route } from "@playwright/test";
import { DEFAULT_VALID_PASSWORD } from "./constants";
import type { apiClient } from "../../lib/api/api-client";

/**
 * The JSON shape returned by `GET /api/trips` for each trip.
 * Inferred from the Eden treaty client so it stays in sync with the API.
 */
type TripsGetResponse = Awaited<ReturnType<typeof apiClient.api.trips.get>>;

type TripsListPage = NonNullable<TripsGetResponse["data"]>;

export type MockTrip = TripsListPage["data"][number];

/**
 * Creates a mock trip object matching the TripWithDestinationDTO shape.
 */
export function createMockTrip(overrides?: Partial<MockTrip>): MockTrip {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    destinationId: faker.string.uuid(),
    title: "Trip to Tokyo",
    archived: false,
    status: "current",
    startDate: "2026-04-01",
    endDate: "2026-04-10",
    createdAt: new Date(),
    updatedAt: new Date(),
    destination: {
      id: faker.string.uuid(),
      name: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      imagesUrls: [
        {
          caption: "",
          isCover: true,
          url: "/placeholder.jpg",
        },
      ],
    },
    hasFlights: true,
    hasHotel: true,
    hasItinerary: false,
    ...overrides,
  };
}

/**
 * Creates a mock paginated trips response.
 */
export function createMockTripsResponse(trips: MockTrip[]): TripsListPage {
  return {
    data: trips,
    nextCursor: null,
    hasMore: false,
  };
}

/**
 * Creates a mock chat history response with optional messages.
 */
export function createMockChatHistory(
  messages: Array<{ type: string; content: string; id?: string }> = [],
) {
  return { messages };
}

/**
 * Intercepts trips list API calls and returns mock data.
 * Matches any GET request to /api/trips (with or without query params).
 * Uses a URL predicate so it matches `/api/trips` and `/api/trips?cursor=...`
 * but not sub-routes like `/api/trips/:id`.
 */
export async function mockTripsListApi(
  page: Page,
  trips: MockTrip[],
): Promise<void> {
  await page.route(
    (url) => url.pathname.endsWith("/api/trips"),
    async (route: Route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createMockTripsResponse(trips)),
      });
    },
  );
}

/**
 * Intercepts chat history API and returns mock data.
 */
export async function mockChatHistoryApi(
  page: Page,
  tripId: string,
  messages: Array<{ type: string; content: string; id?: string }> = [],
): Promise<void> {
  await page.route(
    `**/api/trips/${tripId}/chat/history`,
    async (route: Route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createMockChatHistory(messages)),
      });
    },
  );
}

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

  // Wait for the sign-in form to be ready
  await page
    .getByTestId("toggle-to-sign-up")
    .waitFor({ state: "visible", timeout: 15000 });

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

  // After sign-up, an email verification screen is shown.
  // Click "Do later" to skip verification and proceed to the dashboard.
  const doLaterButton = page.getByTestId("verify-email-do-later");
  await doLaterButton.waitFor({ state: "visible", timeout: 10000 });
  await doLaterButton.click();

  // Wait for redirect to chat dashboard
  await page.waitForURL("/chat", { timeout: 15000 });

  // Wait for the greeting to be visible (don't use networkidle — persistent
  // connections prevent it from settling under parallel test load)
  await page.getByTestId("greeting-message").waitFor({
    state: "visible",
    timeout: 15000,
  });

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

  // Wait for the form to be ready
  await page
    .getByTestId("sign-in-email-input")
    .waitFor({ state: "visible", timeout: 15000 });

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

  // Wait for redirect to chat dashboard
  await page.waitForURL("/chat", { timeout: 15000 });

  // Wait for the dashboard to be ready
  await page.getByTestId("greeting-message").waitFor({
    state: "visible",
    timeout: 15000,
  });
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

  // Wait for the sign-in form to be ready
  await page.getByTestId("sign-in-email-input").waitFor({
    state: "visible",
    timeout: 15000,
  });
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
