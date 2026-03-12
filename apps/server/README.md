# TripLoom API Server

Standalone Bun/Elysia server that runs the `@trip-loom/api` engine on port 3001.

## Running

```bash
# From monorepo root
pnpm dev:server

# Or from this directory
bun dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

This server does not define extra environment variables beyond what `@trip-loom/api` reads directly.

For the full list, including observability variables like `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT`, see `packages/api/README.md`.
