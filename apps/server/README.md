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

Copy `.env.example` to `.env` and fill in your values. See `packages/api/README.md` for full env var documentation.
