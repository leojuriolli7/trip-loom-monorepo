import { BackendApiEnv } from "@trip-loom/api/env";

export interface ServerAppEnv extends BackendApiEnv {
  OTEL_SERVICE_NAME?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends ServerAppEnv {}
  }
}

export {};
