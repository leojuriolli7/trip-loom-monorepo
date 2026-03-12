import { Elysia } from "elysia";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import type { ObservabilityConfig } from "./config";

/**
 * Sets up Elysia request tracing and exports spans to OTLP when an endpoint is
 * configured. If no OTLP endpoint is provided, tracing stays disabled.
 */
export function createTracingPlugin(config: ObservabilityConfig) {
  if (!config.traceExporterUrl) {
    return new Elysia({ name: "tracing" });
  }

  return new Elysia({ name: "tracing" }).use(
    opentelemetry({
      serviceName: config.serviceName,
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({ url: config.traceExporterUrl }),
        ),
      ],
    }),
  );
}
