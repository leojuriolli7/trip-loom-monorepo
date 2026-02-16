import { test, expect } from "@playwright/test";
import {
  signUpUser,
  openPreferencesDialog,
  savePreferences,
} from "./fixtures/utils";

test.describe("User Preferences", () => {
  test.beforeEach(async ({ page }) => {
    // Sign up and be logged in before each test
    await signUpUser(page);
  });

  test("should open preferences dialog from user menu", async ({ page }) => {
    await openPreferencesDialog(page);

    // Dialog should be visible
    await expect(page.getByTestId("preferences-dialog")).toBeVisible();
    await expect(page.getByText("Travel Preferences")).toBeVisible();
  });

  test("should show loading state while fetching preferences", async ({
    page,
  }) => {
    // Click the user avatar to open dropdown
    await page.getByTestId("user-avatar-trigger").click();

    // Click the Profile menu item
    await page.getByTestId("preferences-menu-item").click();

    // Loading spinner should appear briefly (or form should load)
    // We check that either loading or form is visible
    const loadingOrForm = page
      .getByTestId("preferences-loading")
      .or(page.getByTestId("cabin-class-select"));
    await expect(loadingOrForm).toBeVisible();

    // Eventually the form should load
    await expect(page.getByTestId("cabin-class-select")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display all form fields correctly", async ({ page }) => {
    await openPreferencesDialog(page);

    // Check all form sections are present
    await expect(page.getByText("Preferred Cabin Class")).toBeVisible();
    await expect(page.getByText("Budget Range")).toBeVisible();
    await expect(page.getByText("Travel Interests")).toBeVisible();
    await expect(page.getByText("Preferred Regions")).toBeVisible();
    await expect(page.getByText("Dietary Restrictions")).toBeVisible();
    await expect(page.getByText("Accessibility Needs")).toBeVisible();
    await expect(page.getByTestId("save-preferences-button")).toBeVisible();
  });

  test("should select cabin class preference", async ({ page }) => {
    await openPreferencesDialog(page);

    // Open cabin class dropdown and select Business
    await page.getByTestId("cabin-class-select").click();
    await page.getByRole("option", { name: "Business" }).click();

    // Verify selection
    await expect(page.getByTestId("cabin-class-select")).toContainText(
      "Business",
    );
  });

  test("should select budget range preference", async ({ page }) => {
    await openPreferencesDialog(page);

    // Open budget range dropdown and select Luxury
    await page.getByTestId("budget-range-select").click();
    await page.getByRole("option", { name: "Luxury" }).click();

    // Verify selection
    await expect(page.getByTestId("budget-range-select")).toContainText(
      "Luxury",
    );
  });

  test("should toggle travel interests", async ({ page }) => {
    await openPreferencesDialog(page);

    // Click on beaches interest
    const beachesButton = page.getByTestId("interest-beaches");
    await beachesButton.click();

    // Should now have the selected styling (bg-primary/10 is only on selected)
    await expect(beachesButton).toHaveClass(/bg-primary/);

    // Click again to deselect
    await beachesButton.click();

    // Should have bg-background (not selected)
    await expect(beachesButton).toHaveClass(/bg-background/);
  });

  test("should toggle preferred regions", async ({ page }) => {
    await openPreferencesDialog(page);

    // Click on Europe region
    const europeButton = page.getByTestId("region-europe");
    await europeButton.click();

    // Should now have the selected styling
    await expect(europeButton).toHaveClass(/bg-primary/);

    // Click again to deselect
    await europeButton.click();

    // Should have bg-background (not selected)
    await expect(europeButton).toHaveClass(/bg-background/);
  });

  test("should add and remove dietary restrictions", async ({ page }) => {
    await openPreferencesDialog(page);

    // Add a dietary restriction
    const dietaryInput = page.getByTestId("dietary-input");
    await dietaryInput.fill("vegan");
    await dietaryInput.press("Enter");

    // Badge should appear (use exact match to avoid matching field description)
    const badge = page.getByText("vegan", { exact: true });
    await expect(badge).toBeVisible();

    // Remove the restriction
    await page.getByTestId("remove-dietary-vegan").click();

    // Badge should be gone
    await expect(badge).not.toBeVisible();
  });

  test("should fill accessibility needs", async ({ page }) => {
    await openPreferencesDialog(page);

    // Fill in accessibility needs
    const accessibilityText = "Wheelchair accessible rooms required";
    await page.getByTestId("accessibility-textarea").fill(accessibilityText);

    // Verify the value
    await expect(page.getByTestId("accessibility-textarea")).toHaveValue(
      accessibilityText,
    );
  });

  test("should save preferences successfully", async ({ page }) => {
    await openPreferencesDialog(page);

    // Select some preferences
    await page.getByTestId("cabin-class-select").click();
    await page.getByRole("option", { name: "Business" }).click();

    await page.getByTestId("budget-range-select").click();
    await page.getByRole("option", { name: "Upscale" }).click();

    await page.getByTestId("interest-culture").click();
    await page.getByTestId("interest-food").click();

    await page.getByTestId("region-europe").click();

    // Save preferences and wait for API response
    await savePreferences(page);

    // Success toast should appear
    await expect(
      page.locator("[data-sonner-toast][data-type='success']"),
    ).toBeVisible({ timeout: 10000 });

    // Dialog should close
    await expect(page.getByTestId("preferences-dialog")).not.toBeVisible();
  });

  test("should persist saved preferences", async ({ page }) => {
    // First, set some preferences
    await openPreferencesDialog(page);

    // Select First Class
    await page.getByTestId("cabin-class-select").click();
    await page.getByRole("option", { name: "First Class" }).click();

    // Select a travel interest
    await page.getByTestId("interest-adventure").click();

    // Save and wait for API response
    await savePreferences(page);
    await expect(
      page.locator("[data-sonner-toast][data-type='success']"),
    ).toBeVisible({ timeout: 10000 });

    // Reopen the dialog (data may be cached, so we just wait for form)
    await page.getByTestId("user-avatar-trigger").click();
    await page.getByTestId("preferences-menu-item").waitFor({ state: "visible" });
    await page.getByTestId("preferences-menu-item").click();
    await page.getByTestId("cabin-class-select").waitFor({
      state: "visible",
      timeout: 15000,
    });

    // Verify preferences were persisted
    await expect(page.getByTestId("cabin-class-select")).toContainText(
      "First Class",
    );
    await expect(page.getByTestId("interest-adventure")).toHaveClass(
      /bg-primary/,
    );
  });

  test("should close dialog when clicking outside or pressing escape", async ({
    page,
  }) => {
    await openPreferencesDialog(page);

    await expect(page.getByTestId("preferences-dialog")).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");

    // Dialog should be closed
    await expect(page.getByTestId("preferences-dialog")).not.toBeVisible();
  });

  test("should select multiple travel interests", async ({ page }) => {
    await openPreferencesDialog(page);

    // Select multiple interests
    await page.getByTestId("interest-beaches").click();
    await page.getByTestId("interest-food").click();
    await page.getByTestId("interest-nightlife").click();
    await page.getByTestId("interest-hiking").click();

    // All should be selected (have bg-primary class)
    await expect(page.getByTestId("interest-beaches")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("interest-food")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("interest-nightlife")).toHaveClass(
      /bg-primary/,
    );
    await expect(page.getByTestId("interest-hiking")).toHaveClass(/bg-primary/);
  });

  test("should select multiple preferred regions", async ({ page }) => {
    await openPreferencesDialog(page);

    // Select multiple regions
    await page.getByTestId("region-europe").click();
    await page.getByTestId("region-east-asia").click();
    await page.getByTestId("region-caribbean").click();

    // All should be selected
    await expect(page.getByTestId("region-europe")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("region-east-asia")).toHaveClass(/bg-primary/);
    await expect(page.getByTestId("region-caribbean")).toHaveClass(/bg-primary/);
  });

  test("should add multiple dietary restrictions", async ({ page }) => {
    await openPreferencesDialog(page);

    const dietaryInput = page.getByTestId("dietary-input");

    // Add multiple dietary restrictions (use unique names not in field description)
    await dietaryInput.fill("vegan");
    await dietaryInput.press("Enter");
    await dietaryInput.fill("halal");
    await dietaryInput.press("Enter");
    await dietaryInput.fill("nut-allergy");
    await dietaryInput.press("Enter");

    // All badges should appear (use exact match)
    await expect(page.getByText("vegan", { exact: true })).toBeVisible();
    await expect(page.getByText("halal", { exact: true })).toBeVisible();
    await expect(page.getByText("nut-allergy", { exact: true })).toBeVisible();
  });

  test("should not add duplicate dietary restrictions", async ({ page }) => {
    await openPreferencesDialog(page);

    const dietaryInput = page.getByTestId("dietary-input");

    // Add the same restriction twice
    await dietaryInput.fill("kosher");
    await dietaryInput.press("Enter");
    await dietaryInput.fill("kosher");
    await dietaryInput.press("Enter");

    // Should only have one badge (use exact match to avoid field description)
    const badges = page.getByText("kosher", { exact: true });
    await expect(badges).toHaveCount(1);
  });

  test("should reset to no preference for cabin class", async ({ page }) => {
    await openPreferencesDialog(page);

    // First select Business
    await page.getByTestId("cabin-class-select").click();
    await page.getByRole("option", { name: "Business" }).click();
    await expect(page.getByTestId("cabin-class-select")).toContainText(
      "Business",
    );

    // Then reset to No preference
    await page.getByTestId("cabin-class-select").click();
    await page.getByRole("option", { name: "No preference" }).click();
    await expect(page.getByTestId("cabin-class-select")).toContainText(
      "No preference",
    );
  });
});
