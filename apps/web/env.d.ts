import type { BackendApiEnv } from "@trip-loom/api/env";

export interface WebAppEnv extends BackendApiEnv {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  OTEL_SERVICE_NAME?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends WebAppEnv {}
  }
}

export {};
