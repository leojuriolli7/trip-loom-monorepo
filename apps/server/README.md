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

## Environment Variables

This app requires the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `OTEL_SERVICE_NAME` | No | Service name for traces and logs (default: `trip-loom-api`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OTLP HTTP endpoint for trace export (default: `http://localhost:4318/v1/traces`) |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | No | OTLP HTTP endpoint for log export (default: `http://localhost:4318/v1/logs`) |
| `OPEN_METEO_BASE_URL` | No | Override Open-Meteo forecast API base URL |
| `OPEN_METEO_GEOCODING_BASE_URL` | No | Override Open-Meteo geocoding API base URL |
| `WEATHER_REQUEST_TIMEOUT_MS` | No | Timeout in milliseconds for outbound weather requests |
