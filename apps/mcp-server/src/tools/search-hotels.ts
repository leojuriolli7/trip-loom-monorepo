import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { amenityValues, priceRangeValues } from "@trip-loom/contracts/enums";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerSearchHotels(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "search_hotels",
    {
      title: "Search Hotels",
      description:
        "Search available hotels with optional filters for destination, amenities, price range, minimum rating, and free-text query. Returns paginated results with `data`, `hasMore`, and `nextCursor`.",
      inputSchema: z.object({
        destinationId: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Optional destination ID filter to restrict hotels to a selected destination.",
          ),
        search: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe(
            "Optional free-text query to match hotel name, address, and description.",
          ),
        priceRange: z
          .enum(priceRangeValues)
          .optional()
          .describe("Optional hotel price tier filter."),
        minRating: z
          .number()
          .min(0)
          .max(5)
          .optional()
          .describe("Optional minimum hotel rating filter (0-5)."),
        amenities: z
          .array(z.enum(amenityValues))
          .optional()
          .describe(
            "Optional array of required amenities (AND logic — hotel must have all). E.g., ['pool', 'spa', 'gym'].",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Optional page size (1-100). Defaults to 20."),
        cursor: z
          .string()
          .optional()
          .describe(
            "Optional pagination cursor from a previous response `nextCursor`.",
          ),
      }),
    },
    async ({ destinationId, search, priceRange, minRating, amenities, limit, cursor }) => {
      const { data, error } = await apiClient.api.hotels.get({
        query: {
          destinationId,
          search,
          priceRange,
          minRating,
          amenities,
          limit: limit ?? 20,
          cursor,
        },
      });

      if (error) {
        const message =
          error.status === 422
            ? "Invalid hotel search parameters (for example, malformed cursor or invalid filter value)."
            : `Failed to search hotels: ${error.status ?? "unknown error"}`;

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
