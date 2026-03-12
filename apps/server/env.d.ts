import { BackendApiEnv } from "@trip-loom/api/env";

export interface ServerAppEnv extends BackendApiEnv {}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends ServerAppEnv {}
  }
}

export {};
