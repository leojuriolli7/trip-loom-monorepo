import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();
    await page.goto("/");
    // Wait for the landing page to render (don't use networkidle — persistent
    // connections like React Query devtools prevent it from settling)
    await page
      .getByTestId("landing-page")
      .waitFor({ state: "visible", timeout: 15000 });
  });

  test("should display the landing page for unauthenticated users", async ({
    page,
  }) => {
    await expect(page.getByTestId("landing-page")).toBeVisible();
  });

  test("should display hero section with heading", async ({ page }) => {
    const hero = page.getByTestId("landing-hero");
    await expect(hero).toBeVisible();

    const heading = page.getByTestId("landing-hero-heading");
    await expect(heading).toContainText("Travel at the");
    await expect(heading).toContainText("speed of thought");
  });

  test("should display navigation header with sign in link", async ({
    page,
  }) => {
    const header = page.getByTestId("landing-header");
    await expect(header).toBeVisible();

    // Verify TripLoom logo/brand is visible
    await expect(header.getByText("TripLoom")).toBeVisible();

    // Verify sign in button is visible
    const signInLink = page.getByTestId("landing-sign-in");
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveText("Sign in");
  });

  test("should display Start Planning and See it in action buttons", async ({
    page,
  }) => {
    const startPlanning = page.getByTestId("landing-start-planning");
    await expect(startPlanning).toBeVisible();
    await expect(startPlanning).toContainText("Start Planning");

    await expect(
      page.getByRole("link", { name: "See it in action" }),
    ).toBeVisible();
  });

  test("should navigate to /enter when clicking Sign in", async ({ page }) => {
    await page.getByTestId("landing-sign-in").click();
    await page.waitForURL("/enter", { timeout: 10000 });
    expect(page.url()).toContain("/enter");
  });

  test("should redirect to /enter when clicking Start Planning (unauthenticated)", async ({
    page,
  }) => {
    await page.getByTestId("landing-start-planning").click();
    // Unauthenticated users clicking "Start Planning" → /chat → redirected to /enter
    await page.waitForURL("/enter", { timeout: 15000 });
    expect(page.url()).toContain("/enter");
  });
});
