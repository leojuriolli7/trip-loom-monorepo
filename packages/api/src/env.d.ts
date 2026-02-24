export type BackendApiEnv = {
  DATABASE_URL: string;
  API_BASE_URL: string;
  BETTER_AUTH_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TRUSTED_ORIGINS?: string;
  CORS_ORIGINS?: string;
  OTEL_SERVICE_NAME?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT?: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends BackendApiEnv {}
  }
}

export {};
