import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { travelInterestValues, regionValues } from "@trip-loom/contracts/enums";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerSearchDestinations(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "search_destinations",
    {
      title: "Search Destinations",
      description:
        "Search TripLoom destinations with optional filters for free-text terms, region, country, and highlight. Returns paginated results with `data`, `hasMore`, and `nextCursor` for sequential page retrieval.",
      inputSchema: z.object({
        search: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe(
            "Optional search text (e.g., 'beach city', 'ski', 'food scene'). Full-text matches destination content.",
          ),
        region: z
          .enum(regionValues)
          .optional()
          .describe(
            "Optional geographic region filter.",
          ),
        country: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe(
            "Optional country name filter (e.g., 'Japan', 'Italy', 'Brazil').",
          ),
        highlight: z
          .enum(travelInterestValues)
          .optional()
          .describe(
            "Optional travel-interest filter to narrow destinations by highlight (e.g., beaches, food, nightlife).",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe(
            "Optional page size (1-100). Defaults to 20 if omitted.",
          ),
        cursor: z
          .string()
          .optional()
          .describe(
            "Optional pagination cursor from a previous response `nextCursor` to fetch the next page.",
          ),
      }),
    },
    async ({ search, region, country, highlight, limit, cursor }) => {
      const { data, error } = await apiClient.api.destinations.get({
        query: {
          search,
          region,
          country,
          highlight,
          limit: limit ?? 20,
          cursor,
        },
      });

      if (error) {
        const message =
          error.status === 422
            ? "Invalid destination search parameters (for example, malformed cursor or invalid filter value)."
            : `Failed to search destinations: ${error.status ?? "unknown error"}`;

        return {
          isError: true as const,
          content: [{ type: "text" as const, text: message }],
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );
}
