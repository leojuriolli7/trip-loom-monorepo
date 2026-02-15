import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "./index";

export type ApiClient = Treaty.Create<App>;

export const createApiClient = (baseUrl: string): ApiClient =>
  treaty<App>(baseUrl);

export type { App };
