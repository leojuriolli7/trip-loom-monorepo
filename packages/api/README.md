# @trip-loom/api

The API definition package for TripLoom. This package contains the Elysia app with all routes, handlers, and schemas.

## Mental Model: Engine vs Vehicle

Think of this package as an **engine**, not a car:

| Layer | Role | Example |
|-------|------|---------|
| `packages/api` | The engine (routes, handlers, schemas) | This package |
| `apps/server/` | The primary vehicle | Standalone Bun/Elysia server |

The API package **defines** the application logic but doesn't **run** anything by itself. Consumers mount it wherever they need to deploy.

## Domain Docs

Cross-domain flow documentation lives in `packages/api/docs`:

- `docs/trip-lifecycle.md`
- `docs/booking-payment-flow.md`
- `docs/cancellation-refund-policy.md`
- `docs/itinerary-lifecycle.md`

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

### `@trip-loom/api`

Factory for creating the Elysia app instance.

```typescript
import { createApp } from "@trip-loom/api";

const app = createApp({
  serviceName: process.env.OTEL_SERVICE_NAME,
  traceExporterUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  logsExporterUrl: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
});

app.listen(3001);
```

### `@trip-loom/api/dto`

Shared API DTOs and enum values for consumers (frontend, MCP server, etc).

```typescript
import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { tripStatusValues } from "@trip-loom/api/enums";
```

## Structure

```
src/
├── docs/                   # Domain and cross-domain behavior docs
├── index.ts                # Main Elysia app factory, exports `createApp` and `type App`
├── db/
│   ├── index.ts            # Database connection (Drizzle + Postgres)
│   └── schema.ts           # Drizzle schema (includes Better Auth tables)
├── dto/                    # API contracts (zod schemas + TS types)
├── mappers/                # Select field sets + row-to-DTO mappers
├── services/               # DB orchestration and business logic
├── routes/                 # Route modules
├── errors/
│   └── http-errors.ts      # Shared custom HTTP errors
└── lib/
    ├── auth/               # Better Auth configuration + Elysia requireAuth macro
    ├── pagination.ts       # Cursor pagination helpers
    ├── date-range.ts       # Shared date-range validation helper
    ├── otel/               # OpenTelemetry tracing + log export plugin
    ├── wide-events/        # Structured logging plugin (1 JSON log per request)
    └── [domain]/           # Domain rules (eg. `lib/trips/rules.ts`)
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
import { Elysia } from "elysia";
import { tripsRoutes } from "./routes/trips";
import { auth } from "./lib/auth";

export const createApp = () =>
  new Elysia({ name: "api" })
    .mount(auth.handler)
    .use(healthRoutes)
    .use(tripsRoutes); // Add new routes here
```

## Error Handling Conventions

Business-rule failures should be thrown from services/domain helpers using shared custom HTTP errors.

```typescript
import { BadRequestError } from "../errors";

if (!isValidDateRange(startDate, endDate)) {
  throw new BadRequestError("startDate must be before or equal to endDate");
}
```

These errors are registered once in `src/index.ts` and formatted in a single app-level `onError` handler.

```typescript
import { Elysia } from "elysia";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "./errors";

export const createApp = () =>
  new Elysia({ name: "api" })
    .error({ BadRequestError, NotFoundError, ForbiddenError, ConflictError })
    .onError(({ code, error, status }) => {
      switch (code) {
        case "BadRequestError":
        case "NotFoundError":
        case "ForbiddenError":
        case "ConflictError":
          return status(error.status, {
            error: error.error,
            message: error.message,
            statusCode: error.status,
          });
      }
    });
```

This keeps route modules thin and avoids repetitive per-route `try/catch` blocks for expected domain errors.

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
| `STRIPE_SECRET_KEY` | Yes (payments) | Stripe secret key for server-side payment operations |
| `STRIPE_WEBHOOK_SECRET` | Yes (payments) | Stripe webhook signing secret |
| `SMTP_HOST` | Yes (email) | SMTP server hostname (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Yes (email) | SMTP server port (e.g., `587`) |
| `SMTP_USER` | Yes (email) | SMTP authentication username |
| `SMTP_PASSWORD` | Yes (email) | SMTP authentication password |
| `SMTP_FROM_EMAIL` | Yes (email) | Sender address for outbound emails |
| `VERIFY_EMAIL_BASE_URL` | Yes (email) | Base URL for verification email links, points to the API server (e.g., `http://localhost:3001`) |
| `FORGOT_PASSWORD_EMAIL_BASE_URL` | Yes (email) | Base URL for password reset email links, points to frontend (e.g., `http://localhost:3000`) |
| `FRONTEND_BASE_URL` | Yes (MCP) | Base URL for our web frontend, used for MCP server to redirect to login page (e.g., `http://localhost:3000`) |
| `TRUSTED_ORIGINS` | Prod | Comma-separated list of trusted origins |
| `CORS_ORIGINS` | Prod | Comma-separated list of CORS origins |
| `MCP_SERVER_URL` | Yes (MCP) | Base URL where the MCP server is (eg: "http://localhost:3002/mcp") |

Environment files (`.env`) live in **apps**, not packages. See `apps/server/.env.example`.

## Observability

The API ships with **OpenTelemetry tracing** and **wide events** (structured logs).

### OpenTelemetry Tracing

Traces are collected via `@elysiajs/opentelemetry`, the official Elysia plugin that instruments Bun's HTTP layer (Node's `auto-instrumentations-node` doesn't work on Bun). The plugin lives in `src/lib/otel/` and sets up both trace export (OTLP protobuf) and a global `LoggerProvider` for wide events log export (OTLP HTTP). Pass OTEL config to `createApp()` — see the usage example above.

### Wide Events (Structured Logging)

Every request produces a single JSON log line emitted in `onAfterResponse`. The plugin lives in `src/lib/wide-events/`.

Auto-populated fields: `timestamp`, `service`, `request_id`, `method`, `path`, `status_code`, `duration_ms`, `outcome`, `error`, `trace_id`, `span_id`.

Enrich events from any route handler:

```typescript
.get("/:id", async ({ params, wideEvent }) => {
  wideEvent.trip_id = params.id;
  // ...
})
```

Route files need `.use(createWideEventPlugin())` for type inference. Elysia deduplicates by the plugin's `name`, so there's no double initialization.

## Database

Uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

### Commands

```bash
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Apply migrations to database
pnpm db:studio    # Open Drizzle Studio GUI
```

## Testing

Run tests from the monorepo root:

```bash
pnpm test:api
```

How it works:

- Starts Docker Postgres (`pnpm db:up`)
- Creates/recreates an isolated test database (`<DATABASE_URL db name>_test`)
- Runs `drizzle-kit migrate` against that test database
- Runs `bun test` against that test database
- Refuses to run if `DATABASE_URL` is not a `*_test` database (test setup guard)

This keeps test runs independent from your main seeded/dev database.

### Test Harness (Recommended)

Use shared helpers from `src/__tests__/harness` when writing new API tests:

- `createTestContext(name)`:
  - Generates unique test ID prefix
  - Cleans context-owned data (including user-owned cascading rows)
  - Provides deterministic timestamp helpers
- `createTestApp()`:
  - Builds an Elysia app with the same error mapping used in production
- `createJsonRequester(app)`:
  - Standard request helper for GET/POST/PUT/PATCH/DELETE
  - Supports auth header injection
- `createHeaderAuthMock(prefix)`:
  - Header-driven auth mocking via `x-test-user-id`

This keeps new tests short and consistent while preserving isolation.

## Standalone Server

The API runs as a standalone Bun/Elysia server in `apps/server/`. See `apps/server/README.md` for details.

```bash
# From monorepo root
pnpm dev:server
```
