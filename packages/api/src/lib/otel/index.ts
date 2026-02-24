import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export interface OtelOptions {
  /**
   * Service name reported in traces and logs.
   * @default process.env.OTEL_SERVICE_NAME ?? "trip-loom-api"
   */
  serviceName?: string;

  /**
   * OTLP HTTP endpoint for trace export.
   * @default process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318/v1/traces"
   */
  exporterUrl?: string;

  /**
   * OTLP HTTP endpoint for log export.
   * @default process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ?? "http://localhost:4318/v1/logs"
   */
  logsExporterUrl?: string;
}

/**
 * Initialise the OpenTelemetry Node SDK with sensible defaults.
 *
 * Call this **once**, as early as possible, before any other imports so the
 * SDK can monkey-patch libraries (pg, http/fetch, etc.).
 *
 * Sets up both **trace** and **log** export via OTLP HTTP. The SDK
 * auto-registers global TracerProvider and LoggerProvider, so downstream
 * code (e.g. the wide-events plugin) can emit log records without any
 * additional wiring.
 *
 * @example Next.js (`apps/web/instrumentation.ts`)
 * ```ts
 * export async function register() {
 *   if (process.env.NEXT_RUNTIME === "nodejs") {
 *     const { initOtel } = await import("@trip-loom/api/otel");
 *     initOtel();
 *   }
 * }
 * ```
 *
 * @example Standalone server (`apps/backend/src/index.ts`)
 * ```ts
 * import { initOtel } from "@trip-loom/api/otel";
 * initOtel();
 *
 * import { app } from "@trip-loom/api";
 * app.listen(3001);
 * ```
 */
export function initOtel(options?: OtelOptions) {
  const traceUrl =
    options?.exporterUrl ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    "http://localhost:4318/v1/traces";

  const logsUrl =
    options?.logsExporterUrl ??
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
    "http://localhost:4318/v1/logs";

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]:
        options?.serviceName ?? process.env.OTEL_SERVICE_NAME ?? "trip-loom-api",
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: traceUrl })
      ),
    ],
    logRecordProcessors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({ url: logsUrl })
      ),
    ],
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  return sdk;
}
