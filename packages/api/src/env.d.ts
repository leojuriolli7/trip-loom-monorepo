import type { AgentsEnv } from "@trip-loom/agents/env";

export interface BackendApiEnv extends AgentsEnv {
  DATABASE_URL: string;
  API_BASE_URL: string;
  OTEL_SERVICE_NAME?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  BETTER_AUTH_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TRUSTED_ORIGINS?: string;
  CORS_ORIGINS?: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM_EMAIL: string;
  VERIFY_EMAIL_BASE_URL: string;
  FORGOT_PASSWORD_EMAIL_BASE_URL: string;
  FRONTEND_BASE_URL: string;
  MCP_SERVER_URL: string;
  OPEN_METEO_BASE_URL?: string;
  OPEN_METEO_GEOCODING_BASE_URL?: string;
  WEATHER_REQUEST_TIMEOUT_MS?: string;
  GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_MAPS_TIMEOUT_MS?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends BackendApiEnv {}
  }
}

export {};
