import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client";

export function registerTripDetailsResource(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerResource(
    "trip-details",
    new ResourceTemplate("triploom://trips/{tripId}", {
      list: async () => {
        const { data, error } = await apiClient.api.trips.get({
          query: { limit: 100 },
        });

        if (error) return { resources: [] };

        return {
          resources: data.data.map((trip) => ({
            uri: `triploom://trips/${trip.id}`,
            name: trip.title ?? `Trip to ${trip.destination?.name ?? "unknown"}`,
            description: `${trip.status} trip${trip.destination ? ` to ${trip.destination.name}` : ""} (${trip.startDate ?? "no dates"} — ${trip.endDate ?? "no dates"})`,
          })),
        };
      },
    }),
    {
      title: "Trip Details",
      description:
        "Full details for a specific trip including destination, flight bookings, hotel bookings, itinerary with daily activities, and payment records.",
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
            : `Failed to fetch trip: ${error.status ?? "unknown error"}`,
        );
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );
}
