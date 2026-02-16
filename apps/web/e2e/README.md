# E2E Tests

End-to-end tests for TripLoom using [Playwright](https://playwright.dev/).

## Prerequisites

Before running tests, ensure **Environment variables are set** in `apps/web/.env`:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `API_BASE_URL`
   - `NEXT_PUBLIC_API_BASE_URL`

## Running Tests

From the **root** of the monorepo or  `apps/web`:

```bash
# Run all E2E tests (starts dev server automatically)
pnpm test:e2e

# Run with interactive UI mode (starts dev server automatically)
pnpm test:e2e:ui


# Run specific test file (starts dev server automatically)
pnpm test:e2e auth.spec.ts
```

## Test Structure

```
e2e/
├── auth.spec.ts          # Authentication tests (sign-in, sign-up, logout)
├── fixtures/
│   ├── constants.ts # Constants used in tests or utils
│   └── utils.ts     # Test utilities and helpers
└── README.md             # This file
```

## Writing Tests

### Selectors

We use `data-testid` attributes for test selectors. Playwright provides `page.getByTestId()`:

```typescript
await page.getByTestId("sign-in-email-input").fill("test@example.com");
await page.getByTestId("sign-in-submit").click();
```

### Adding New Test IDs

When adding new testable elements, add `data-testid` attributes:

```tsx
<Input data-testid="my-input" />
<Button data-testid="my-button">Click me</Button>
```

### Test Utilities

Use helpers from `fixtures/utils.ts`:

```typescript
import { generateTestUser, signUpUser, signInUser, signOutUser } from "./fixtures/utils";

// Generate unique test user
const user = generateTestUser();

// Sign up via UI
await signUpUser(page);

// Sign in via UI
await signInUser(page, { email: user.email, password: user.password });

// Sign out via UI
await signOutUser(page);
```

## Test Database Strategy

- Tests run against the **real, local PostgreSQL database** via docker (no mocks)
- Each test uses **faker e-mails** to avoid conflicts
- No automatic cleanup between tests (use `pnpm db:reset` if needed)

## CI/CD

For CI environments, when `CI=true` enables:
- Stricter test configuration (fail on `test.only`)
- Retries on failure
- Single worker mode
