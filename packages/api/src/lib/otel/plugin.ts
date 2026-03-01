import { Elysia } from "elysia";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { logs } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export interface OtelPluginOptions {
  /**
   * Service name reported in traces and logs.
   * @default "trip-loom-api"
   */
  serviceName?: string;

  /**
   * OTLP HTTP endpoint for trace export.
   * @default "http://localhost:4318/v1/traces"
   */
  traceExporterUrl?: string;

  /**
   * OTLP HTTP endpoint for log export.
   * @default "http://localhost:4318/v1/logs"
   */
  logsExporterUrl?: string;
}

const DEFAULT_SERVICE_NAME = "trip-loom-api";
const DEFAULT_TRACE_EXPORTER_URL = "http://localhost:4318/v1/traces";
const DEFAULT_LOGS_EXPORTER_URL = "http://localhost:4318/v1/logs";

/**
 * Elysia plugin that sets up OpenTelemetry tracing and log export.
 *
 * Uses `@elysiajs/opentelemetry` for Bun-compatible HTTP span creation
 * (Node's `auto-instrumentations-node` doesn't work on Bun since Bun
 * has its own HTTP layer). Also registers a global `LoggerProvider` so
 * the wide-events plugin can emit structured logs via `logs.getLogger()`.
 */
export const createOtelPlugin = (options?: OtelPluginOptions) => {
  const serviceName = options?.serviceName ?? DEFAULT_SERVICE_NAME;
  const traceUrl = options?.traceExporterUrl ?? DEFAULT_TRACE_EXPORTER_URL;
  const logsUrl = options?.logsExporterUrl ?? DEFAULT_LOGS_EXPORTER_URL;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
  });

  // Register global LoggerProvider for wide-events plugin (logs.getLogger())
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(new OTLPLogExporter({ url: logsUrl })),
    ],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  return new Elysia({ name: "otel" }).use(
    opentelemetry({
      serviceName,
      spanProcessors: [
        new BatchSpanProcessor(new OTLPTraceExporter({ url: traceUrl })),
      ],
    }),
  );
};
