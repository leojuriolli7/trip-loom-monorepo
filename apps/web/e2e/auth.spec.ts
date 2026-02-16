import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import {
  DEFAULT_INVALID_PASSWORD,
  DEFAULT_VALID_PASSWORD,
} from "./fixtures/constants";
import {
  generateTestUser,
  signUpUser,
  signInUser,
  signOutUser,
} from "./fixtures/utils";

test.describe("Authentication", () => {
  test.describe("Sign Up", () => {
    test("should create a new account and redirect to dashboard", async ({
      page,
    }) => {
      const testUser = generateTestUser();

      await page.goto("/enter");

      // Switch to sign-up mode
      await page.getByTestId("toggle-to-sign-up").click();

      // Verify we're in sign-up mode
      await expect(page.getByText("Create an account")).toBeVisible();

      // Fill in the form
      await page.getByTestId("sign-up-name-input").fill(testUser.name);
      await page.getByTestId("sign-up-email-input").fill(testUser.email);
      await page.getByTestId("sign-up-password-input").fill(testUser.password);
      await page
        .getByTestId("sign-up-confirm-password-input")
        .fill(testUser.password);

      // Submit
      await page.getByTestId("sign-up-submit").click();

      // Should redirect to dashboard (wait for navigation)
      await page.waitForURL("/", { timeout: 15000 });

      // User name should be visible in the user avatar dropdown
      await page.getByTestId("user-avatar-trigger").click();
      await expect(page.getByTestId("dropdown-user-name")).toContainText(
        testUser.name,
      );
    });

    test("should validate form fields correctly", async ({ page }) => {
      await page.goto("/enter");
      await page.getByTestId("toggle-to-sign-up").click();

      const nameInput = page.getByTestId("sign-up-name-input");
      const emailInput = page.getByTestId("sign-up-email-input");
      const passwordInput = page.getByTestId("sign-up-password-input");
      const confirmPasswordInput = page.getByTestId(
        "sign-up-confirm-password-input",
      );
      const submitButton = page.getByTestId("sign-up-submit");

      // Test 1: Empty form submission
      await submitButton.click();
      await expect(page.getByText("Name is required")).toBeVisible();

      // Test 2: Name too short (must be at least 4 characters)
      await nameInput.fill("Bob");
      await submitButton.click();
      await expect(
        page.getByText("Name must be at least 4 characters"),
      ).toBeVisible();

      // Test 3: Invalid email format
      await nameInput.fill(faker.person.fullName());
      await emailInput.fill("not-an-email");
      await submitButton.click();
      await expect(page.getByText("Invalid email address")).toBeVisible();

      // Test 4: Weak password - check the live password requirements indicator
      await emailInput.fill(faker.internet.email());
      await passwordInput.fill(DEFAULT_INVALID_PASSWORD);

      // Password requirements indicator shows red X for unmet requirements
      const lengthRequirement = page.getByRole("listitem").filter({
        hasText: "At least 8 characters",
      });
      const numberRequirement = page.getByRole("listitem").filter({
        hasText: "At least 1 number",
      });
      const specialCharRequirement = page.getByRole("listitem").filter({
        hasText: "At least 1 special character",
      });

      // Weak password fails all requirements
      await expect(lengthRequirement).toHaveClass(/text-red-500/);
      await expect(numberRequirement).toHaveClass(/text-red-500/);
      await expect(specialCharRequirement).toHaveClass(/text-red-500/);

      // Test 5: Password missing number (but meets length + special char)
      await passwordInput.fill("NoNumber!");
      await expect(lengthRequirement).toHaveClass(/text-green-600/);
      await expect(numberRequirement).toHaveClass(/text-red-500/);
      await expect(specialCharRequirement).toHaveClass(/text-green-600/);

      // Test 6: Password missing special character (but meets length + number)
      await passwordInput.fill("NoSpecial1");
      await expect(lengthRequirement).toHaveClass(/text-green-600/);
      await expect(numberRequirement).toHaveClass(/text-green-600/);
      await expect(specialCharRequirement).toHaveClass(/text-red-500/);

      // Test 7: Passwords don't match
      await passwordInput.fill(DEFAULT_VALID_PASSWORD);
      await confirmPasswordInput.fill("DifferentPassword123!");
      await submitButton.click();
      await expect(page.getByText("Passwords don't match")).toBeVisible();
    });

    test("should show error for duplicate email", async ({ page }) => {
      // First, create a user
      const testUser = await signUpUser(page);

      // Sign out
      await signOutUser(page);

      // Try to sign up with the same email
      await page.getByTestId("toggle-to-sign-up").click();
      await page
        .getByTestId("sign-up-name-input")
        .fill(faker.person.fullName());
      await page.getByTestId("sign-up-email-input").fill(testUser.email);
      await page
        .getByTestId("sign-up-password-input")
        .fill(DEFAULT_VALID_PASSWORD);
      await page
        .getByTestId("sign-up-confirm-password-input")
        .fill(DEFAULT_VALID_PASSWORD);
      await page.getByTestId("sign-up-submit").click();

      // Should show error toast
      await expect(
        page.locator("[data-sonner-toast][data-type='error']"),
      ).toBeVisible();
    });
  });

  test.describe("Sign In", () => {
    test("should sign in existing user and redirect to dashboard", async ({
      page,
    }) => {
      // First create a user
      const testUser = await signUpUser(page);

      // Sign out
      await signOutUser(page);

      // Now sign in
      await signInUser(page, {
        email: testUser.email,
        password: testUser.password,
      });

      // Should be on dashboard
      await expect(page).toHaveURL("/");

      // User name should be visible
      await page.getByTestId("user-avatar-trigger").click();
      await expect(page.getByTestId("dropdown-user-name")).toContainText(
        testUser.name,
      );
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/enter");

      // Try to sign in with non-existent user
      await page
        .getByTestId("sign-in-email-input")
        .fill(faker.internet.email());
      await page
        .getByTestId("sign-in-password-input")
        .fill(faker.internet.password());
      await page.getByTestId("sign-in-submit").click();

      // Should show error toast
      await expect(
        page.locator("[data-sonner-toast][data-type='error']"),
      ).toBeVisible({ timeout: 10000 });

      // Should still be on /enter (not redirected)
      await expect(page).toHaveURL("/enter");
    });
  });

  test.describe("Sign Out", () => {
    test("should sign out and redirect to /enter", async ({ page }) => {
      // First sign up and be logged in
      await signUpUser(page);

      // Verify we're logged in
      await expect(page).toHaveURL("/");

      // Sign out
      await signOutUser(page);

      // Should be redirected to /enter
      await expect(page).toHaveURL("/enter");
    });

    test("should not be able to access dashboard after sign out", async ({
      page,
    }) => {
      // First sign up and be logged in
      await signUpUser(page);

      // Sign out
      await signOutUser(page);

      // Try to access dashboard directly
      await page.goto("/");

      // Should be redirected to /enter
      await expect(page).toHaveURL("/enter");
    });
  });

  test.describe("Route Protection", () => {
    test("should redirect unauthenticated users from / to /enter", async ({
      page,
    }) => {
      // Clear any existing cookies/storage
      await page.context().clearCookies();

      // Try to access dashboard directly
      await page.goto("/");

      // Should be redirected to /enter
      await expect(page).toHaveURL("/enter");
    });

    test("should redirect unauthenticated users from /chat to /enter", async ({
      page,
    }) => {
      // Clear any existing cookies/storage
      await page.context().clearCookies();

      // Try to access chat page directly
      await page.goto("/chat");

      // Should be redirected to /enter
      await expect(page).toHaveURL("/enter");
    });

    test("should redirect authenticated users from /enter to /", async ({
      page,
    }) => {
      // First sign up and be logged in
      await signUpUser(page);

      // Try to access /enter while logged in
      await page.goto("/enter");

      // Should be redirected to dashboard
      await expect(page).toHaveURL("/");
    });
  });
});
