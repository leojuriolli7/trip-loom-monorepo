import { test, expect } from "@playwright/test";
import {
  signUpUser,
  createMockTrip,
  mockTripsListApi,
  mockChatHistoryApi,
} from "./fixtures/utils";

test.describe("Trip Chat Page", () => {
  const mockTrip = createMockTrip({
    title: "Roman Holiday",
    status: "current",
    destination: {
      id: "dest-rome",
      name: "Rome",
      country: "Italy",
      countryCode: "IT",
      imagesUrls: [
        {
          caption: "",
          isCover: true,
          url: "/placeholder.jpg",
        },
      ],
    },
    hasFlights: true,
    hasHotel: false,
    hasItinerary: true,
  });

  test.beforeEach(async ({ page }) => {
    await signUpUser(page);

    // Mock the sidebar trips list
    await mockTripsListApi(page, [mockTrip]);

    // Mock chat history for this trip
    await mockChatHistoryApi(page, mockTrip.id);
  });

  test("should load chat page and display conversation area", async ({
    page,
  }) => {
    await page.goto(`/chat/${mockTrip.id}`);

    const chatPage = page.getByTestId("trip-chat-page");
    await expect(chatPage).toBeVisible({ timeout: 15000 });

    const conversation = page.getByTestId("chat-conversation");
    await expect(conversation).toBeVisible();
  });

  test("should display chat input panel", async ({ page }) => {
    await page.goto(`/chat/${mockTrip.id}`);

    const chatInput = page.getByTestId("chat-input");
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    await expect(chatInput).toHaveAttribute(
      "placeholder",
      "Ask about your trip...",
    );
  });

  test("should display empty state when no messages", async ({ page }) => {
    await page.goto(`/chat/${mockTrip.id}`);

    await page.getByTestId("trip-chat-page").waitFor({
      state: "visible",
      timeout: 15000,
    });

    await expect(
      page.getByText("No messages yet. Start planning your trip"),
    ).toBeVisible();
  });

  test("should display trip in sidebar", async ({ page }) => {
    await page.goto(`/chat/${mockTrip.id}`);

    await page.getByTestId("trip-chat-page").waitFor({
      state: "visible",
      timeout: 15000,
    });

    const sidebarCard = page.getByTestId("sidebar-trip-card").first();
    await expect(sidebarCard).toBeVisible();
    await expect(sidebarCard).toContainText("Roman Holiday");
  });

  test("should show messages when chat history is not empty", async ({
    page,
  }) => {
    // Override the mock to include messages
    await mockChatHistoryApi(page, mockTrip.id, [
      {
        type: "human",
        content: "I want to visit the Colosseum",
        id: "msg-1",
      },
      {
        type: "ai",
        content:
          "The Colosseum is one of Rome's most iconic landmarks! I can help you plan a visit.",
        id: "msg-2",
      },
    ]);

    await page.goto(`/chat/${mockTrip.id}`);

    await page.getByTestId("trip-chat-page").waitFor({
      state: "visible",
      timeout: 15000,
    });

    await expect(page.getByText("I want to visit the Colosseum")).toBeVisible();
    await expect(
      page.getByText(/The Colosseum is one of Rome's most iconic landmarks/),
    ).toBeVisible();
  });

  test("should show error state when chat history fails to load", async ({
    page,
  }) => {
    // Override the chat history mock to return an error
    await page.route(
      `**/api/trips/${mockTrip.id}/chat/history`,
      async (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }

        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      },
    );

    await page.goto(`/chat/${mockTrip.id}`);

    const errorState = page.getByTestId("trip-chat-error");
    await expect(errorState).toBeVisible({ timeout: 15000 });
    await expect(errorState).toContainText(
      "Could not load this chat right now",
    );
  });
});
