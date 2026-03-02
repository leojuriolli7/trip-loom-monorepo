import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client";

export function registerTripItineraryResource(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerResource(
    "trip-itinerary",
    new ResourceTemplate("triploom://trips/{tripId}/itinerary", {
      list: undefined,
    }),
    {
      title: "Trip Itinerary",
      description:
        "The itinerary for a specific trip including all days and their activities with times, locations, and estimated costs. Use a trip ID from the user's trips list.",
      mimeType: "application/json",
    },
    async (uri, { tripId }) => {
      const { data, error } = await apiClient.api
        .trips({ id: String(tripId) })
        .get();

      if (error) {
        throw new Error(
          error.status === 404
            ? `Trip not found: ${tripId}`
            : `Failed to fetch trip itinerary: ${error.status ?? "unknown error"}`,
        );
      }

      const itinerary = data.itinerary;

      if (!itinerary) {
        throw new Error(`No itinerary found for trip: ${tripId}`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(itinerary, null, 2),
          },
        ],
      };
    },
  );
}
