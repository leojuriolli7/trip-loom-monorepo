import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export const apiClient = treaty<App>(process.env.NEXT_PUBLIC_API_BASE_URL);
