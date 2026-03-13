import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchPlacesInputSchema } from "@trip-loom/contracts/dto";
import type { ApiClient } from "../api-client";

export function registerSearchPlaces(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "search_places",
    {
      title: "Search Places",
      description:
        "Search Google Maps places for itinerary planning. When the trip destination is known, pass it in destination so results are biased toward the right city or region. Use this to pick a reliable place before saving itinerary activities.",
      inputSchema: searchPlacesInputSchema,
    },
    async (input) => {
      const { data, error } = await apiClient.api.maps.places.search.get({
        query: input,
      });

      if (error) {
        const message =
          error.status === 400
            ? "Invalid Google Maps place search parameters."
            : error.status === 401
              ? "User is not authenticated to search places."
              : error.status === 429
                ? "Google Maps provider is temporarily rate limited."
                : `Failed to search places: ${error.status ?? "unknown error"}`;

        return {
          isError: true as const,
          content: [{ type: "text" as const, text: message }],
        };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );
}
