export type BackendApiEnv = {
  DATABASE_URL: string;
  API_BASE_URL: string;
  BETTER_AUTH_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TRUSTED_ORIGINS?: string;
  CORS_ORIGINS?: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends BackendApiEnv {}
  }
}

export {};
