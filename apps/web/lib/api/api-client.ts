import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export const apiClient = treaty<App>(process.env.NEXT_PUBLIC_API_BASE_URL, {
  // Date strings will not be converted to Date objects, preserving the Typescript type of "string"
  parseDate: false,
  // Required for cross-origin cookie sending (frontend on :3000, API on :3001)
  fetch: { credentials: "include" },
});
