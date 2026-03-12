export interface ObservabilityConfig {
  otlpEndpoint?: string;
  serviceName: string;
  traceExporterUrl?: string;
}

const DEFAULT_SERVICE_NAME = "trip-loom-api";

export const observabilityConfig: ObservabilityConfig = {
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  serviceName: process.env.OTEL_SERVICE_NAME ?? DEFAULT_SERVICE_NAME,
  traceExporterUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
    : undefined,
};
