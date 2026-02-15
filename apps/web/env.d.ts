import type { BackendApiEnv } from "@trip-loom/api/env";

export interface WebAppEnv extends BackendApiEnv {
  NEXT_PUBLIC_API_BASE_URL: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends BackendApiEnv {
      NEXT_PUBLIC_API_BASE_URL: string;
    }
  }
}

export {};
