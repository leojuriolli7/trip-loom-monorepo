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

## URL Structure

| Path | Description |
|------|-------------|
| `/api/*` | Custom API routes (health, trips, etc.) |
| `/api/auth/*` | Better Auth authentication routes |

Examples:
- `GET /api/health` - Health check
- `POST /api/auth/sign-up/email` - Create account
- `POST /api/auth/sign-in/email` - Sign in
- `GET /api/auth/session` - Get current session

When using the Eden client for custom routes:

```typescript
client.api.health.get() // GET /api/health
```

For authentication, use the Better Auth client directly (see below).

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
├── env.d.ts      # Environment variable type definitions
├── db/
│   ├── index.ts  # Database connection (Drizzle + Postgres)
│   └── schema.ts # Drizzle schema (includes Better Auth tables)
├── lib/
│   └── auth.ts   # Better Auth configuration
└── routes/       # Route modules
    ├── auth.ts   # Authentication routes (Better Auth)
    └── health.ts # Health check endpoint
```

## Adding Routes

Follow the established pattern when adding new route modules:

```typescript
// src/routes/trips.ts
import { Elysia } from "elysia";

export const tripsRoutes = new Elysia({ name: "trips", prefix: "/api/trips" })
  .get("/", () => { /* list trips */ })
  .post("/", ({ body }) => { /* create trip */ })
  .get("/:id", ({ params }) => { /* get trip */ });
```

Then register in `src/index.ts`:

```typescript
import { tripsRoutes } from "./routes/trips";

export const app = new Elysia({ name: "api" })
  .use(authRoutes)
  .use(healthRoutes)
  .use(tripsRoutes); // Add new routes here
```

## Authentication

Authentication is handled by [Better Auth](https://better-auth.com) with email/password support.

### Server-side (in API routes)

```typescript
import { auth } from "@trip-loom/api";

// Get session from request headers
const session = await auth.api.getSession({ headers: request.headers });
```

### Client-side (in Next.js)

```typescript
import { authClient } from "@/lib/auth-client";

// Sign up
await authClient.signUp.email({ email, password, name });

// Sign in
await authClient.signIn.email({ email, password });

// Get session (React hook)
const { data: session } = authClient.useSession();

// Sign out
await authClient.signOut();
```

### Dev vs Production

| Setting | Development | Production |
|---------|-------------|------------|
| Email verification | Disabled | Enabled |
| Rate limiting | Disabled | Enabled |
| Secure cookies | Disabled | Enabled |

## Environment Variables

This package requires the following environment variables (provided by the app that imports it):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth encryption secret (min 32 chars). Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Base URL for auth (e.g., `http://localhost:3000`) |
| `TRUSTED_ORIGINS` | Prod | Comma-separated list of trusted origins |
| `CORS_ORIGINS` | Prod | Comma-separated list of CORS origins |

Environment files (`.env`) live in **apps**, not packages. See `apps/web/.env.example`.

## Database

Uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

### Commands

```bash
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Apply migrations to database
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio GUI
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
