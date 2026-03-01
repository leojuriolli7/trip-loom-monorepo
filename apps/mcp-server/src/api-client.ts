import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export const apiClient = treaty<App>(process.env.API_BASE_URL, {
  parseDate: false,
  fetch: { credentials: "include" },
});
