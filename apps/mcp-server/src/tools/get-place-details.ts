import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPlaceDetailsInputSchema } from "@trip-loom/contracts/dto";
import type { ApiClient } from "../api-client";

export function registerGetPlaceDetails(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "get_place_details",
    {
      title: "Get Place Details",
      description:
        "Fetch canonical Google Maps details for a selected place ID. Use this after search_places when you want a final place payload to attach to an itinerary activity.",
      inputSchema: getPlaceDetailsInputSchema,
    },
    async ({ placeId, languageCode, regionCode }) => {
      const { data, error } = await apiClient.api.maps
        .places({ placeId })
        .get({
          query: { languageCode, regionCode },
        });

      if (error) {
        const message =
          error.status === 400
            ? "Invalid Google Maps place details parameters."
            : error.status === 401
              ? "User is not authenticated to fetch place details."
              : error.status === 404
                ? `Google Maps place not found: ${placeId}`
                : error.status === 429
                  ? "Google Maps provider is temporarily rate limited."
                  : `Failed to fetch place details: ${error.status ?? "unknown error"}`;

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
