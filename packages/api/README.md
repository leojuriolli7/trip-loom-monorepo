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

### `@trip-loom/api` (server-only)

The main Elysia app instance. Protected by `server-only` to prevent accidental client-side imports.

```typescript
import { app } from "@trip-loom/api";

// Mount in Next.js route handlers
export const GET = app.handle;
export const POST = app.handle;
```

### `@trip-loom/api/dto`

Shared API DTOs and enum values for consumers (frontend, MCP server, etc).

```typescript
import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { tripStatusValues } from "@trip-loom/api/enums";
```

### `@trip-loom/api/otel`

OpenTelemetry SDK initializer. Call once, as early as possible, so the SDK can monkey-patch libraries before they're imported.

```typescript
import { initOtel } from "@trip-loom/api/otel";

initOtel(); // uses env vars for defaults
```

## Structure

```
src/
├── docs/                   # Domain and cross-domain behavior docs
├── index.ts                # Main Elysia app, exports `app` and `type App`
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
    ├── auth.ts             # Better Auth configuration
    ├── auth-plugin.ts      # Auth macro plugin (`auth: true`)
    ├── pagination.ts       # Cursor pagination helpers
    ├── date-range.ts       # Shared date-range validation helper
    ├── otel/               # OpenTelemetry SDK wrapper (`initOtel`)
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
import { tripsRoutes } from "./routes/trips";
import { auth } from "./lib/auth";

export const app = new Elysia({ name: "api" })
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
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "./errors";

export const app = new Elysia({ name: "api" })
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
| `TRUSTED_ORIGINS` | Prod | Comma-separated list of trusted origins |
| `CORS_ORIGINS` | Prod | Comma-separated list of CORS origins |
| `OTEL_SERVICE_NAME` | No | Service name for traces and logs (default: `"trip-loom-api"`). Standard OTel env var — set to a unique value per service (e.g. `trip-loom-mcp`, `trip-loom-web`). |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OTLP HTTP endpoint for trace export (default: `http://localhost:4318/v1/traces`) |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | No | OTLP HTTP endpoint for log export (default: `http://localhost:4318/v1/logs`) |

Environment files (`.env`) live in **apps**, not packages. See `apps/web/.env.example`.

## Observability

The API ships with two complementary observability layers: **wide events** (structured logs) and **OpenTelemetry tracing** (distributed traces). They correlate automatically — every log line includes the `trace_id` and `span_id` of the active trace when OTel is enabled. When `initOtel()` is called, wide events are also exported via OTLP to your observability backend (SigNoz, Grafana, etc.).

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

### OpenTelemetry Tracing

The `@trip-loom/api/otel` export wraps the Node.js OTel SDK. It auto-instruments `pg`, `http`/`fetch`, and other libraries so DB queries and outgoing HTTP calls (e.g. Stripe) appear as child spans in a waterfall view. It also sets up a `LoggerProvider` so wide events are exported via OTLP alongside traces.

#### Instrumentation Setup — Next.js

Next.js calls `register()` in `instrumentation.ts` before any imports, early enough for the SDK to patch libraries:

```typescript
// apps/web/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initOtel } = await import("@trip-loom/api/otel");
    initOtel();
  }
}
```

Dynamic imports ensure OTel only loads on the Node.js runtime, not on the edge.

#### Instrumentation Setup — Standalone Server

For a standalone deployment, call `initOtel()` before importing the app:

```typescript
// apps/backend/src/index.ts
import { initOtel } from "@trip-loom/api/otel";
initOtel();

import { app } from "@trip-loom/api";

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
```

#### `initOtel` Options

| Option | Default | Description |
|--------|---------|-------------|
| `serviceName` | `OTEL_SERVICE_NAME` env or `"trip-loom-api"` | Service name in traces and logs |
| `exporterUrl` | `OTEL_EXPORTER_OTLP_ENDPOINT` env or `http://localhost:4318/v1/traces` | OTLP HTTP endpoint for traces |
| `logsExporterUrl` | `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` env or `http://localhost:4318/v1/logs` | OTLP HTTP endpoint for logs |

The OTel SDK also natively reads `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, and `OTEL_EXPORTER_OTLP_HEADERS` from the environment.

#### Local Dev — SigNoz

The `docker-compose.yml` includes SigNoz services behind a Docker Compose profile:

```bash
docker compose --profile signoz up -d   # starts Postgres + SigNoz
```

- SigNoz UI: `http://localhost:8080` (traces, logs, and metrics)
- OTLP HTTP receiver: `http://localhost:4318`
- OTLP gRPC receiver: `http://localhost:4317`

SigNoz provides a unified view of traces and logs, with automatic `trace_id` correlation between the two.

#### Production

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to your tracing backend:

| Provider | Traces Endpoint | Logs Endpoint |
|----------|----------------|---------------|
| Grafana Cloud | `https://otlp-gateway-<region>.grafana.net/otlp/v1/traces` | `https://otlp-gateway-<region>.grafana.net/otlp/v1/logs` |
| Axiom | `https://api.axiom.co/v1/traces` | `https://api.axiom.co/v1/logs` |
| Datadog | `localhost:4318/v1/traces` (via agent sidecar) | `localhost:4318/v1/logs` |
| SigNoz Cloud | Your SigNoz ingest URL | Your SigNoz ingest URL |

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
- Runs `vitest` against that test database
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

## Adding a Standalone Server

If you later need to deploy the API separately (e.g., on a VPS), create `apps/backend`:

```typescript
// apps/backend/src/index.ts
import { initOtel } from "@trip-loom/api/otel";
initOtel(); // must be called before importing the app

import { app } from "@trip-loom/api";

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
```

This keeps the separation clean: the package remains a library, and apps are the deployment targets.
