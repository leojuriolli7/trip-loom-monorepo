import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Creates an Eden treaty client authenticated with an MCP OAuth access token.
 * Each MCP session gets its own client instance.
 */
export function createApiClient(accessToken: string) {
  return treaty<App>(process.env.API_BASE_URL!, {
    parseDate: false,
    headers: { authorization: `Bearer ${accessToken}` },
  });
}
