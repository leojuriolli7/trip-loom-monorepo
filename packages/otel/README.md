# @trip-loom/otel

Shared OpenTelemetry SDK initializer for TripLoom services.

This package does not read environment variables. All configuration is passed explicitly to `initOtel(...)`.

## Usage

Call `initOtel()` **once**, as early as possible, before importing your app code so the SDK can monkey-patch libraries (`pg`, `http`/`fetch`, etc.).

```typescript
import { initOtel } from "@trip-loom/otel";

initOtel({ serviceName: "trip-loom-mcp" });

// Now import your app — instrumentation is active
import { app } from "./app";
```

### Next.js

```typescript
// apps/web/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initOtel } = await import("@trip-loom/otel");
    initOtel({
      serviceName: process.env.OTEL_SERVICE_NAME,
      traceExporterUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      logsExporterUrl: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
    });
  }
}
```

### Standalone Server

```typescript
import { initOtel } from "@trip-loom/otel";
initOtel({ serviceName: "trip-loom-api" });

import { createApp } from "@trip-loom/api";
const app = createApp({ loggerServiceName: "trip-loom-api" });
app.listen(3001);
```

## `initOtel` Options

| Option | Default | Description |
|--------|---------|-------------|
| `serviceName` | `"trip-loom-api"` | Service name in traces and logs |
| `traceExporterUrl` | `http://localhost:4318/v1/traces` | OTLP HTTP endpoint for traces |
| `logsExporterUrl` | `http://localhost:4318/v1/logs` | OTLP HTTP endpoint for logs |

## Environment Variables

Environment variables are optional and owned by each consuming app. If you use them, map them in your app layer (for example in `instrumentation.ts`) and pass the values to `initOtel`.

Typical variables:

| Variable | Purpose |
|----------|---------|
| `OTEL_SERVICE_NAME` | Per-service name (`trip-loom-api`, `trip-loom-web`, `trip-loom-mcp`, etc.) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces endpoint |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Logs endpoint |
| `OTEL_EXPORTER_OTLP_HEADERS` | Optional auth headers (parsed natively by OTel exporters, if configured in your runtime) |

## Local Dev — SigNoz

```bash
pnpm docker:up   # starts Postgres + SigNoz
```

- SigNoz UI: `http://localhost:8080`
- OTLP HTTP: `localhost:4318`
- OTLP gRPC: `localhost:4317`

## Production

Point the env vars at your backend:

| Provider | Endpoint |
|----------|----------|
| Grafana Cloud | `https://otlp-gateway-<region>.grafana.net/otlp/v1/traces` |
| Axiom | `https://api.axiom.co/v1/traces` |
| SigNoz Cloud | Your SigNoz ingest URL |
