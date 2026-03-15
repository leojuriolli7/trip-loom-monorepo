import { test, expect } from "@playwright/test";
import {
  signUpUser,
  createMockTrip,
  mockTripsListApi,
  mockChatHistoryApi,
} from "./fixtures/utils";

test.describe("Share Trip", () => {
  const mockTrip = createMockTrip({
    title: "Tokyo Adventure",
    status: "current",
    destination: {
      id: "dest-tokyo",
      name: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      imagesUrls: [
        { caption: "", isCover: true, url: "/placeholder.jpg" },
      ],
    },
    hasFlights: true,
    hasHotel: true,
    hasItinerary: false,
  });

  const mockShareToken = "abc123sharetoken";
  const mockShareUrl = `http://localhost:3000/share/${mockShareToken}`;

  test.beforeEach(async ({ page }) => {
    await signUpUser(page);
    await mockTripsListApi(page, [mockTrip]);
    await mockChatHistoryApi(page, mockTrip.id);
  });

  test("should open share dialog and enable sharing", async ({ page }) => {
    // Mock the share status endpoint (not shared yet)
    await page.route(
      `**/api/trips/${mockTrip.id}/share`,
      async (route) => {
        const method = route.request().method();

        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ shareToken: null }),
          });
        } else if (method === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              shareToken: mockShareToken,
              shareUrl: mockShareUrl,
            }),
          });
        } else {
          await route.fallback();
        }
      },
    );

    await page.goto(`/chat/${mockTrip.id}`);

    // Wait for the page to load
    const shareButton = page.getByTestId("share-trip-button");
    await expect(shareButton).toBeVisible({ timeout: 15000 });

    // Click share button
    await shareButton.click();

    // Wait for dialog
    const dialog = page.getByTestId("share-dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify "Start Sharing" button is visible (not shared yet)
    const startSharingButton = page.getByTestId("start-sharing-button");
    await expect(startSharingButton).toBeVisible();

    // Now mock the GET to return the token after enabling
    await page.route(
      `**/api/trips/${mockTrip.id}/share`,
      async (route) => {
        const method = route.request().method();

        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ shareToken: mockShareToken }),
          });
        } else if (method === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              shareToken: mockShareToken,
              shareUrl: mockShareUrl,
            }),
          });
        } else {
          await route.fallback();
        }
      },
    );

    // Click start sharing
    await startSharingButton.click();

    // Verify the share URL appears
    const shareUrlText = page.getByTestId("share-url-text");
    await expect(shareUrlText).toBeVisible({ timeout: 10000 });
    await expect(shareUrlText).toContainText(mockShareToken);

    // Verify copy button is visible
    await expect(page.getByTestId("copy-share-link-button")).toBeVisible();
  });

  test("should show shared state when trip is already shared", async ({
    page,
  }) => {
    // Mock share status as already shared
    await page.route(
      `**/api/trips/${mockTrip.id}/share`,
      async (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ shareToken: mockShareToken }),
        });
      },
    );

    await page.goto(`/chat/${mockTrip.id}`);

    const shareButton = page.getByTestId("share-trip-button");
    await expect(shareButton).toBeVisible({ timeout: 15000 });
    await shareButton.click();

    const dialog = page.getByTestId("share-dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Should show the share URL and stop sharing button
    await expect(page.getByTestId("share-url-text")).toBeVisible();
    await expect(page.getByTestId("stop-sharing-button")).toBeVisible();
  });

  test("should stop sharing when clicking stop sharing button", async ({
    page,
  }) => {
    // Initially shared
    let isShared = true;

    await page.route(
      `**/api/trips/${mockTrip.id}/share`,
      async (route) => {
        const method = route.request().method();

        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              shareToken: isShared ? mockShareToken : null,
            }),
          });
        } else if (method === "DELETE") {
          isShared = false;
          await route.fulfill({ status: 204 });
        } else {
          await route.fallback();
        }
      },
    );

    await page.goto(`/chat/${mockTrip.id}`);

    const shareButton = page.getByTestId("share-trip-button");
    await expect(shareButton).toBeVisible({ timeout: 15000 });
    await shareButton.click();

    const dialog = page.getByTestId("share-dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click stop sharing
    const stopButton = page.getByTestId("stop-sharing-button");
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Dialog should close after stopping
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});

test.describe("Shared Trip Public Page", () => {
  const mockSharedTrip = {
    id: "trip-123",
    title: "Tokyo Adventure",
    status: "current",
    startDate: "2026-04-01",
    endDate: "2026-04-10",
    destination: {
      id: "dest-tokyo",
      name: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      imagesUrls: [
        { caption: "", isCover: true, url: "/placeholder.jpg" },
      ],
    },
    flightBookings: [
      {
        id: "flight-1",
        type: "outbound",
        flightNumber: "NH101",
        airline: "ANA",
        departureAirportCode: "LAX",
        departureCity: "Los Angeles",
        departureTime: "2026-04-01T08:00:00.000Z",
        arrivalAirportCode: "NRT",
        arrivalCity: "Tokyo",
        arrivalTime: "2026-04-02T12:00:00.000Z",
        durationMinutes: 720,
        cabinClass: "economy",
        status: "confirmed",
      },
    ],
    hotelBookings: [],
    itinerary: null,
  };

  test("should display shared trip content without auth", async ({ page }) => {
    // Mock the shared trip API
    await page.route("**/api/shared/valid-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSharedTrip),
      });
    });

    await page.goto("/share/valid-token");

    // Verify the page loads
    const sharedPage = page.getByTestId("shared-trip-page");
    await expect(sharedPage).toBeVisible({ timeout: 15000 });

    // Verify trip title
    await expect(page.getByTestId("shared-trip-title")).toContainText(
      "Tokyo Adventure",
    );

    // Verify flights section
    await expect(page.getByTestId("shared-flights-section")).toBeVisible();
    await expect(page.getByText("ANA")).toBeVisible();
    await expect(page.getByText("NH101")).toBeVisible();

    // Verify CTA button exists
    await expect(page.getByTestId("plan-your-trip-cta")).toBeVisible();
  });

  test("should show 404 page for invalid share token", async ({ page }) => {
    await page.route("**/api/shared/invalid-token", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: "NotFound",
          message: "Shared trip not found",
          statusCode: 404,
        }),
      });
    });

    await page.goto("/share/invalid-token");

    const notFoundPage = page.getByTestId("shared-trip-not-found");
    await expect(notFoundPage).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Trip not found")).toBeVisible();
  });
});
