import { test, expect } from "@playwright/test";
import {
  signUpUser,
  createMockTrip,
  mockTripsListApi,
  type TestUser,
} from "./fixtures/utils";

test.describe("Chat Dashboard", () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    testUser = await signUpUser(page);
  });

  test("should display greeting message", async ({ page }) => {
    const greeting = page.getByTestId("greeting-message");
    await expect(greeting).toBeVisible();

    // Greeting shows time-of-day message
    await expect(greeting).toContainText(/Good (morning|afternoon|evening)/);

    // User name should be visible in the sidebar user info
    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 10000 });
  });

  test("should display welcome screen", async ({ page }) => {
    await expect(page.getByTestId("welcome-screen")).toBeVisible();
  });

  test("should display quick action cards", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Explore destinations/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Book accommodations/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Plan itinerary/i }),
    ).toBeVisible();
  });

  test("should display new chat input", async ({ page }) => {
    const input = page.getByTestId("new-chat-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute(
      "placeholder",
      "Where would you like to go?",
    );
  });

  test("should make GET /api/trips request on page load", async ({ page }) => {
    // Navigate away and back to observe the trips request
    const tripsRequest = page.waitForResponse(
      (res) =>
        res.url().includes("/api/trips") && res.request().method() === "GET",
    );

    await page.goto("/chat");
    await tripsRequest;
  });

  test.describe("with current trip", () => {
    const mockTrip = createMockTrip({
      title: "Spring in Tokyo",
      status: "current",
      destination: {
        id: "dest-1",
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
    });

    test.beforeEach(async ({ page }) => {
      // Intercept the current trips query to return our mock trip
      await mockTripsListApi(page, [mockTrip]);
    });

    test("should display CurrentTripCard with trip title and destination", async ({
      page,
    }) => {
      await page.goto("/chat");
      await page
        .getByTestId("welcome-screen")
        .waitFor({ state: "visible", timeout: 10000 });

      const tripCard = page.getByTestId("current-trip-card");
      await expect(tripCard).toBeVisible({ timeout: 10000 });

      await expect(page.getByTestId("current-trip-title")).toHaveText(
        "Spring in Tokyo",
      );
      await expect(page.getByTestId("current-trip-destination")).toContainText(
        "Tokyo, Japan",
      );
    });

    test("should display trip feature badges", async ({ page }) => {
      await page.goto("/chat");
      await page
        .getByTestId("welcome-screen")
        .waitFor({ state: "visible", timeout: 10000 });

      const tripCard = page.getByTestId("current-trip-card");
      await expect(tripCard).toBeVisible({ timeout: 10000 });

      // Trip has flights and hotel, but not itinerary
      await expect(
        tripCard.getByText("Flights", { exact: true }),
      ).toBeVisible();
      await expect(tripCard.getByText("Hotel", { exact: true })).toBeVisible();
    });

    test("should show Continue trip chat button", async ({ page }) => {
      await page.goto("/chat");
      await page
        .getByTestId("welcome-screen")
        .waitFor({ state: "visible", timeout: 10000 });

      const continueButton = page.getByTestId("current-trip-continue-button");
      await expect(continueButton).toBeVisible({ timeout: 10000 });
      await expect(continueButton).toContainText("Continue trip chat");
    });
  });
});
