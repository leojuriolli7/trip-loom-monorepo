# @trip-loom/api

The API definition package for TripLoom. This package contains the Elysia app with all routes, handlers, and schemas.

## Mental Model: Engine vs Vehicle

Think of this package as an **engine**, not a car:

| Layer | Role | Example |
|-------|------|---------|
| `packages/api` | The engine (routes, handlers, schemas) | This package |
| `apps/web/app/api/` | A vehicle that mounts the engine | Next.js route handlers |
| `apps/backend/` | More powerful vehicle (if needed later) | Standalone server |

The API package **defines** the application logic but doesn't **run** anything by itself. Consumers mount it wherever they need to deploy.

## URL Prefix

All routes are prefixed with `/api`. This is configured in the Elysia app:

```typescript
export const app = new Elysia({ prefix: "/api" })
```

This means:
- A route defined as `.api.get("/health", ...)` is accessible at `/api/health`
- A route defined as `.api.post("/auth/login", ...)` is accessible at `/api/auth/login`

When using the Eden client, the prefix is reflected in the path:

```typescript
client.api.health.get()      // GET /api/health
client.api.auth.login.post() // POST /api/auth/login
```

## Exports

### `@trip-loom/api` (server-only)

The main Elysia app instance. Protected by `server-only` to prevent accidental client-side imports.

```typescript
import { app } from "@trip-loom/api";

// Mount in Next.js route handlers
export const GET = app.handle;
export const POST = app.handle;
```

### `@trip-loom/api/client`

Type-safe Eden client for consuming the API from anywhere.

```typescript
import { createApiClient } from "@trip-loom/api/client";

const api = createApiClient("http://localhost:3000");

// Fully typed - TypeScript knows the response shape
const { data, error } = await api.api.health.get();
```

## Structure

```
src/
├── index.ts      # Main Elysia app, exports `app` and `type App`
├── client.ts     # Eden client factory, exports `createApiClient`
└── modules/      # Feature modules (auth, trips, flights, etc.)
    └── ...
```

## Adding a Standalone Server

If you later need to deploy the API separately (e.g., on a VPS), create `apps/backend`:

```typescript
// apps/backend/src/index.ts
import { app } from "@trip-loom/api";

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
```

This keeps the separation clean: the package remains a library, and apps are the deployment targets.
