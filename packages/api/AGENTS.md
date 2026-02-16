# API Package - Agent Guidelines

This is the backend API for TripLoom, built with **Elysia** (TypeScript web framework), **Drizzle ORM** (PostgreSQL), and **Better Auth** for authentication.

## Project Structure

```
packages/api/
├── src/
│   ├── index.ts              # Main app entry, registers all routes
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema definitions
│   ├── dto/                  # Data Transfer Objects (API contracts)
│   │   ├── common.ts         # Shared schemas (errors, pagination response)
│   │   └── [domain].ts       # Domain-specific schemas
│   ├── lib/
│   │   ├── auth.ts           # Better Auth configuration
│   │   ├── auth-plugin.ts    # Elysia auth plugin with macros
│   │   ├── nanoid.ts         # ID generation
│   │   ├── pagination.ts     # Pagination helpers and query builders
│   ├── mappers/              # Field projections for queries
│   │   └── [domain].ts       # e.g., destinationSelectFields
│   ├── routes/               # Elysia route handlers
│   │   └── [domain].ts       # e.g., destinations.ts
│   ├── services/             # Business logic
│   │   └── [domain].ts       # e.g., destinations.ts
│   └── __tests__/            # Unit tests (Vitest)
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
  // Detail endpoint
  .get("/:id", async ({ params, status }) => {
    const result = await getItemById(params.id);
    if (!result) {
      return status(404, {
        error: "Not Found",
        message: "Item not found",
        statusCode: 404,
      });
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
- `authHandlerPlugin` at app root (mounts Better Auth HTTP handlers)
- `authMacroPlugin` in protected route modules (enables `{ auth: true }` and typed `user/session`)

```typescript
// src/index.ts (root app)
import { authHandlerPlugin } from "./lib/auth-plugin";

export const app = new Elysia({ name: "api" })
  .use(authHandlerPlugin)
  .use(tripRoutes);
```

```typescript
// src/routes/trips.ts (protected module)
import { authMacroPlugin } from "../lib/auth-plugin";

export const tripRoutes = new Elysia({ name: "trips", prefix: "/api/trips" })
  .use(authMacroPlugin)
  // Public route (no auth)
  .get("/featured", () => getFeaturedTrips())
  // Protected route - just add { auth: true }
  .get("/", ({ user, query }) => {
    return listTrips(user.id, query);
  }, { auth: true, query: tripQuerySchema })
```

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

## Consistency Rules

1. **Single source of truth**: `PaginatedResponse<T>` is declared only in `src/dto/common.ts`
2. **Do not duplicate pagination types** in `lib/` or domain files
3. **Do not export unused helpers/types** - remove dead exports instead of leaving placeholders
4. **Prefer shared helpers** over per-route custom pagination/search logic

## Database Operations

**IMPORTANT**: All database operations MUST be performed using the package.json scripts. NEVER run raw SQL commands or use psql directly.

Available commands (run from monorepo root):

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Push schema directly (for development, bypasses migrations)
pnpm db:push

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

## Testing

Tests use **Vitest** and run against a real database:

```bash
pnpm test:api
```

The test command automatically:
1. Starts the database container (`pnpm db:up`)
2. Pushes the schema (`pnpm db:push`)
3. Runs Vitest

### Test File Structure

```
src/__tests__/
├── utils/                  # Shared test utilities
│   ├── index.ts           # Re-exports all utils
│   └── test-db.ts         # Database context & cleanup
├── fixtures/              # Reusable test data factories
│   ├── index.ts           # Re-exports all fixtures
│   └── destinations.ts    # Destination & hotel fixtures
└── [domain].test.ts       # Domain-specific tests
```

### Writing New Tests

Use shared utilities to avoid boilerplate:

```typescript
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { Elysia } from "elysia";
import { itemRoutes } from "../routes/items";
import { createTestContext } from "./utils";
import { createTestItems } from "./fixtures";

// 1. Create isolated test context with unique prefix
const ctx = createTestContext("items");
const testItems = createTestItems(ctx.prefix);
const app = new Elysia().use(itemRoutes);

// 2. Local request helper (avoid shared helpers due to Elysia's complex types)
const get = async (path: string) => {
  const res = await app.handle(new Request(`http://localhost${path}`));
  return { res, body: await res.json() };
};

describe("Items API", () => {
  // 3. Setup: cleanup stale data, then seed fresh
  beforeAll(async () => {
    await ctx.cleanup();
    await ctx.seed(testItems);
  });

  // 4. Teardown: cleanup after tests
  afterAll(async () => {
    await ctx.cleanup();
  });

  it("should return paginated list", async () => {
    const { res, body } = await get("/api/items?limit=2");

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2);
  });
});
```

### Test Utilities

**`createTestContext(name)`** - Creates isolated test environment:
- `ctx.prefix` - Unique prefix for all IDs (includes timestamp + random suffix)
- `ctx.cleanup()` - Deletes all data with this prefix
- `ctx.seed(destinations, hotels)` - Inserts deterministic timestamps for stable pagination/order tests
- Current cleanup covers `destination` and `hotel`; extend cleanup as new domain tables are added

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
import type { TestDestination } from "../utils";

export function createTestDestinations(
  prefix: string,
  region: string
): TestDestination[] {
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
2. **Always use mappers** - Define `*SelectFields` for consistency
3. **Always use shared helpers** - `combineConditions`, `buildCursorCondition`, etc.
4. **Always define response schemas** - Both list and detail endpoints
5. **Use `status()` for errors** - Better type inference than `set.status`
6. **Keep services DB-focused** - Business logic in services, HTTP in routes
7. **Test all endpoints** - Pagination, filters, 404s, auth
8. **Keep exports minimal** - If a symbol is unused, remove it

## Seed Data

Seed data files are located in `packages/api/seeds/data/`:
- `destinations.json` - Destination data (~50 destinations)
- `hotels.json` - Hotel data (~300-500 hotels)

See `plans/SEED.md` for the full seed data specification.
