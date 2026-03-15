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
        "Search TripLoom destinations with optional filters for free-text terms, regions, countries, and highlights. Prefer using structured filters (highlights, regions, countries) over free-text search for better results. The search param uses PostgreSQL full-text search and works best with short, specific terms — not natural language sentences. Returns paginated results with `data`, `hasMore`, and `nextCursor` for sequential page retrieval.",
      inputSchema: z.object({
        search: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe(
            "Optional free-text search (e.g., 'beach city', 'ski', 'food scene'). Full-text matches destination content.",
          ),
        regions: z
          .array(z.enum(regionValues))
          .optional()
          .describe(
            "Optional array of regions to filter by (OR logic). E.g., ['Europe', 'North America'].",
          ),
        countries: z
          .array(z.string().trim().min(1))
          .optional()
          .describe(
            "Optional array of country names to filter by (OR logic). E.g., ['Japan', 'Italy', 'Brazil'].",
          ),
        highlights: z
          .array(z.enum(travelInterestValues))
          .optional()
          .describe(
            "Optional array of travel interests to filter by (OR logic). E.g., ['food', 'architecture', 'culture'].",
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
    async ({ search, regions, countries, highlights, limit, cursor }) => {
      const { data, error } = await apiClient.api.destinations.get({
        query: {
          search,
          regions,
          countries,
          highlights,
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
