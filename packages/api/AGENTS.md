# API Package - Agent Guidelines

This is the backend API for TripLoom, built with **Elysia** (TypeScript web framework), **Drizzle ORM** (PostgreSQL), and **Better Auth** for authentication.

## Project Structure

```
packages/api/
├── src/
│   ├── index.ts              # Main app entry, registers all routes
│   ├── errors/               # Custom HTTP error classes
│   │   └── http-errors.ts
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema definitions
│   ├── dto/                  # Data Transfer Objects (API contracts)
│   │   ├── common.ts         # Shared schemas (errors, pagination response)
│   │   └── [domain].ts       # Domain-specific schemas
│   ├── lib/
│   │   ├── auth.ts           # Better Auth configuration
│   │   ├── auth-plugin.ts    # Elysia auth plugin with macros
│   │   ├── date-range.ts     # Shared date range validation helpers
│   │   ├── nanoid.ts         # ID generation
│   │   ├── pagination.ts     # Pagination helpers and query builders
│   │   └── [domain]/         # Domain rules and pure business helpers
│   ├── mappers/              # Field projections for queries
│   │   └── [domain].ts       # e.g., destinationSelectFields + row-to-DTO mappers
│   ├── routes/               # Elysia route handlers
│   │   └── [domain].ts       # e.g., destinations.ts
│   ├── services/             # Business logic
│   │   └── [domain].ts       # e.g., destinations.ts
│   └── __tests__/            # API integration + unit tests (Vitest)
├── seeds/                    # Database seeding
│   ├── data/                 # JSON seed files
│   ├── seed.ts               # Seed script
│   └── validate.ts           # Seed validation schemas
├── drizzle/                  # Generated migrations
└── vitest.config.ts          # Test configuration
```

## Creating New Endpoints

Follow this pattern for all new domain endpoints:

### 1. Define DTO Schemas (`src/dto/[domain].ts`)

```typescript
import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination";
import { statusEnum } from "../db/schema"; // Import DB enum

// Enum values - ALWAYS derive from DB schema for type safety
export const statusValues = statusEnum.enumValues;

// Response schema - what the API returns
export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(statusValues), // Use derived enum values
  // ... fields
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ItemDTO = z.infer<typeof itemSchema>;

// Query params - MUST extend paginationQuerySchema
export const itemQuerySchema = paginationQuerySchema.extend({
  // Domain-specific filters only
  status: z.enum(statusValues).optional(),
});

export type ItemQuery = z.infer<typeof itemQuerySchema>;
```

**Important**: Always use `enumName.enumValues` from the DB schema instead of manually defining enum arrays. This ensures compile-time type safety - if the DB enum changes, TypeScript will catch mismatches.

### 2. Create Mappers (`src/mappers/[domain].ts`)

```typescript
import { item } from "../db/schema";

// Shared select fields - avoids duplication between list/detail queries
export const itemSelectFields = {
  id: item.id,
  name: item.name,
  // ... all fields matching DTO
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
} as const;
```

### 3. Implement Service (`src/services/[domain].ts`)

```typescript
import { eq, arrayContains } from "drizzle-orm";
import { db } from "../db";
import { item } from "../db/schema";
import type { ItemDTO, ItemQuery } from "../dto/items";
import type { PaginatedResponse } from "../dto/common";
import {
  paginate,
  buildCursorCondition,
  buildSearchCondition,
  combineConditions,
  paginationOrderBy,
} from "../lib/pagination";
import { itemSelectFields } from "../mappers/items";

export async function listItems(
  query: ItemQuery
): Promise<PaginatedResponse<ItemDTO>> {
  const { cursor, limit, search, category } = query;

  // Use shared helpers for conditions
  const whereCondition = combineConditions(
    category ? eq(item.category, category) : undefined,
    buildSearchCondition(item.searchVector, search),
    buildCursorCondition(cursor, item.createdAt, item.id)
  );

  const results = await db
    .select(itemSelectFields)
    .from(item)
    .where(whereCondition)
    .orderBy(...paginationOrderBy(item.createdAt, item.id))
    .limit(limit + 1);

  return paginate(results, limit);
}
```

### 4. Define Routes (`src/routes/[domain].ts`)

```typescript
import { Elysia } from "elysia";
import { z } from "zod";
import { listItems, getItemById } from "../services/items";
import { itemQuerySchema, itemSchema, itemWithStatsSchema } from "../dto/items";
import { errorResponseSchema, paginatedResponseSchema } from "../dto/common";
import { NotFoundError } from "../errors";

export const itemRoutes = new Elysia({
  name: "items",
  prefix: "/api/items",
})
  // List endpoint - MUST have response schema
  .get("/", async ({ query }) => listItems(query), {
    query: itemQuerySchema,
    response: {
      200: paginatedResponseSchema(itemSchema),
    },
  })
  // Detail endpoint - throw errors instead of inline status
  .get("/:id", async ({ params }) => {
    const result = await getItemById(params.id);
    if (!result) {
      throw new NotFoundError("Item not found");
    }
    return result;
  }, {
    params: z.object({ id: z.string().min(1) }),
    response: {
      200: itemWithStatsSchema,
      404: errorResponseSchema,
    },
  });
```

### 4.1 Error Handling Pattern (Required)

**Always throw custom errors** from `src/errors/http-errors.ts` instead of using inline `status()` calls. This keeps routes thin and error formatting centralized.

```typescript
// Good: Throw custom errors (in services)
import { NotFoundError, BadRequestError } from "../errors";

if (!result) {
  throw new NotFoundError("Item not found");
}

if (!isValidDateRange(startDate, endDate)) {
  throw new BadRequestError("startDate must be before or equal to endDate");
}

// Bad: Inline status calls in services
return status(404, {
  error: "Not Found",
  message: "Item not found",
  statusCode: 404,
});
```

Custom errors are registered once in `src/index.ts` using `.error(...)` + `.onError(...)` and automatically formatted to the standardized shape:

```typescript
{
  error: string;
  message: string;
  statusCode: number;
}
```

Routes should stay thin and avoid local `try/catch` for expected business errors.

### 5. Register Routes (`src/index.ts`)

```typescript
import { itemRoutes } from "./routes/items";
// ...
.use(itemRoutes)
```

### 6. Write Tests (`src/__tests__/[domain].test.ts`)

```typescript
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { Elysia } from "elysia";
import { db } from "../db";
import { item } from "../db/schema";
import { itemRoutes } from "../routes/items";

const app = new Elysia().use(itemRoutes);

describe("Items API", () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup
  });

  it("should return paginated list", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/items")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("nextCursor");
    expect(data).toHaveProperty("hasMore");
  });
});
```

## Authentication

Use split auth plugins:
- `auth.handler` mounted at app root (mounts Better Auth HTTP handlers)
- `requireAuthMacro` in protected route modules (enables `{ auth: true }` and typed `user/session`)

```typescript
// src/index.ts (root app)
import { auth } from "./lib/auth";

export const app = new Elysia({ name: "api" })
  .mount(auth.handler)
  .use(tripRoutes);
```

```typescript
// src/routes/trips.ts (protected module)
import { requireAuthMacro } from "../lib/auth-plugin";

export const tripRoutes = new Elysia({ name: "trips", prefix: "/api/trips" })
  .use(requireAuthMacro)
  // Public route (no auth)
  .get("/featured", () => getFeaturedTrips())
  // Protected route - just add { auth: true }
  .get("/", ({ user, query }) => {
    return listTrips(user.id, query);
  }, { auth: true, query: tripQuerySchema })
```

**Why `requireAuthMacro` + `auth: true`?**

Elysia macros require redeclaration in each route module for TypeScript to infer the injected context types (`user`, `session`). The macro defines the behavior, and `auth: true` activates it per-route:

- `requireAuthMacro` registers the macro and makes `{ auth: true }` available
- `auth: true` on a route enables the macro, returning 401 if unauthenticated
- Without `auth: true`, the route is public (macro runs but doesn't enforce auth)
- Without `.use(requireAuthMacro)`, TypeScript won't recognize `{ auth: true }` or type `user`/`session`

The `auth: true` macro:
- Returns 401 if not authenticated
- Injects `user` and `session` into the handler context
- Uses `resolve` (runs after validation) for security

## Pagination Contract

All paginated endpoints MUST follow this contract:

1. **Query schema extends `paginationQuerySchema`**
2. **Service uses shared helpers**: `buildCursorCondition`, `combineConditions`, `paginationOrderBy`
3. **Query fetches `limit + 1`** rows to detect `hasMore`
4. **Sort order is `createdAt DESC, id DESC`** (deterministic)
5. **Response uses `paginatedResponseSchema(itemSchema)`**
6. **Invalid cursor returns 400** via route query validation (never silently ignored)
7. **Full-text search uses `buildSearchCondition`** (`websearch_to_tsquery`) for safe user input

Response shape:
```typescript
{
  data: Item[],
  nextCursor: string | null,
  hasMore: boolean
}
```

## Shared Utilities

### `lib/pagination.ts`
- `paginationQuerySchema` - Base query schema (extend with `.extend()`)
- `buildCursorCondition()` - Cursor decoding + WHERE condition
- `buildSearchCondition()` - Full-text search with tsvector + `websearch_to_tsquery`
- `combineConditions()` - AND multiple conditions
- `paginationOrderBy()` - Standard sort order
- `paginate()` - Build response from results

### `dto/common.ts`
- `errorResponseSchema` - Standard error shape
- `paginatedResponseSchema()` - Wrap item schema for list responses
- `PaginatedResponse<T>` - Single source of truth for paginated TypeScript shape

### `mappers/[domain].ts`
- Define `*SelectFields` constants to avoid duplicating field lists
- For complex domains, also keep row-to-DTO mapping helpers here (not in service files)

### `errors/http-errors.ts`
- Shared typed HTTP errors (`BadRequestError`, `NotFoundError`, etc.)
- Services and domain-rule helpers throw these for business-rule failures
- `src/index.ts` has the single `.onError(...)` mapping for response formatting

## Consistency Rules

1. **Single source of truth**: `PaginatedResponse<T>` is declared only in `src/dto/common.ts`
2. **Do not duplicate pagination types** in `lib/` or domain files
3. **Do not export unused helpers/types** - remove dead exports instead of leaving placeholders
4. **Prefer shared helpers** over per-route custom pagination/search logic
5. **Derive types from Drizzle or DTOs** - Never redeclare inline types. Use `DB_New*` types from `db/types.ts` for insert operations and DTO types from `dto/` for API contracts:

```typescript
// Good: Derive from Drizzle types
import type { DB_NewItineraryDay, DB_NewItineraryActivity } from "../db/types";

const dayRows: DB_NewItineraryDay[] = [];
const activityRows: DB_NewItineraryActivity[] = [];

// Bad: Inline type declarations
const dayRows: { id: string; itineraryId: string; ... }[] = [];
```

## Database Operations

**IMPORTANT**: All database operations MUST be performed using the package.json scripts. NEVER run raw SQL commands or use psql directly.

Available commands (run from monorepo root):

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate


# Open Drizzle Studio to inspect/manage database
pnpm db:studio

# Stop the database container
pnpm db:down

# Reset database (destroys all data)
pnpm db:reset

# Seed the database with destinations and hotels
pnpm db:seed

# Seed with clean (clears existing data first)
pnpm db:seed -- --clean

# Validate seed data without inserting
pnpm db:seed:validate

# Run tests
pnpm test:api
```

### Test Database Isolation (Required)

- `pnpm test:api` must run against an isolated test database, never the main development database.
- The API test runner recreates `<DATABASE_URL db name>_test`, applies migrations, then runs Vitest.
- Use migrations (`db:migrate`) for deterministic schema behavior.
- Vitest setup fails fast if `DATABASE_URL` does not point to a `*_test` DB.
- Non-local test DB hosts are blocked by default.

## Testing

Tests use **Vitest** and run against a real database:

```bash
pnpm test:api
```

The test command automatically:
1. Starts the database container (`pnpm db:up`)
2. Recreates an isolated test database (`<DATABASE_URL db name>_test`)
3. Applies migrations (`drizzle-kit migrate`)
4. Runs Vitest against the test database

### Test File Structure

```
src/__tests__/
├── harness/               # Shared test harness helpers
│   ├── app.ts             # Test app factory with production error mapping
│   ├── auth.ts            # Header-driven auth mocking
│   ├── db.ts              # Test DB context + cleanup + deterministic timestamps
│   ├── http.ts            # Request helper (GET/POST/PUT/PATCH/DELETE)
│   └── index.ts           # Harness exports
├── fixtures/              # Reusable test data factories
│   └── destinations.ts    # Destination & hotel fixtures
├── setup.ts               # Global Vitest setup (test DB safety guard)
└── [domain].test.ts       # Domain-specific tests
```

### Writing New Tests

Use shared utilities to avoid boilerplate:

```typescript
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { itemRoutes } from "../routes/items";
import {
  createJsonRequester,
  createTestApp,
  createTestContext,
} from "./harness";
import { createTestItems } from "./fixtures";
import { db } from "../db";
import { item } from "../db/schema";

// 1. Create isolated test context with unique prefix
const ctx = createTestContext("items");
const testItems = createTestItems(ctx.prefix);
const app = createTestApp().use(itemRoutes);
const request = createJsonRequester(app);

describe("Items API", () => {
  // 3. Setup: cleanup stale data, then seed fresh
  beforeAll(async () => {
    await ctx.cleanup();
    await db.insert(item).values(testItems);
  });

  // 4. Teardown: cleanup after tests
  afterAll(async () => {
    await ctx.cleanup();
  });

  it("should return paginated list", async () => {
    const { res, body } = await request.get("/api/items?limit=2");

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2);
  });
});
```

### Test Utilities

**`createTestContext(name)`** - Creates isolated test environment:
- `ctx.prefix` - Unique prefix for all IDs (includes timestamp + random suffix)
- `ctx.cleanup()` - Deletes all context-owned data and user-owned cascading rows
- `ctx.seedDestinationsAndHotels(destinations, hotels)` - Inserts deterministic timestamps for stable pagination/order tests
- `ctx.timestamp(index, offsetMs)` - Stable timestamp helper for order-sensitive assertions
- Extend cleanup rules in `src/__tests__/harness/db.ts` when introducing new tables that cannot be cleaned through existing cascades

**`createTestApp()`**:
- Creates a test app with production-equivalent HTTP error mapping

**`createJsonRequester(app)`**:
- Shared request helper with consistent JSON parsing and optional test auth header

**`createHeaderAuthMock(prefix)`**:
- Enables auth mocking based on `x-test-user-id`
- Use `enable()` in `beforeAll` and `restore()` in `afterAll`

### Test Isolation

Tests run in parallel. To avoid data collisions:

1. **Use unique prefixes** - Each test file gets its own context name
2. **Filter by test data** - Use `destinationId` or `region` filters to query only your data
3. **Never use exact counts without filters** - Other test files may have similar data

```typescript
// Good: Filter to your test data
const { body } = await get(`/api/hotels?destinationId=${tokyoId}`);
expect(body.data.length).toBe(3); // Only your 3 hotels

// Bad: No filter, count depends on other tests
const { body } = await get("/api/hotels");
expect(body.data.length).toBe(3); // May fail if other tests added hotels
```

### Creating Fixtures

Add fixture factories to `src/__tests__/fixtures/`:

```typescript
import { generateId } from "../../lib/nanoid";
import type { DB_NewDestination } from "../../db/types";

export function createTestDestinations(
  prefix: string,
  region: string
): DB_NewDestination[] {
  return [
    {
      id: `${prefix}${generateId()}`,
      name: "TestTokyo",
      region,
      // ... other fields
    },
  ];
}
```

## Best Practices

1. **Always extend shared schemas** - Never duplicate pagination fields
2. **Always use mappers** - Define `*SelectFields` (and row mappers for complex domains) for consistency
3. **Always use shared helpers** - `combineConditions`, `buildCursorCondition`, etc.
4. **Always define response schemas** - Both list and detail endpoints
5. **Throw custom HTTP errors in services/domain rules** - Keep HTTP error formatting centralized in app-level `onError`
6. **Keep services DB-focused** - Business logic in services, HTTP in routes
7. **Test all endpoints** - Pagination, filters, 404s, auth
8. **Keep exports minimal** - If a symbol is unused, remove it

## Seed Data

Seed data files are located in `packages/api/seeds/data/`:
- `destinations.json` - Destination data 
- `hotels.json` - Hotel data
