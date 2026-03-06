import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerGetTripDetails(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "get_trip_details",
    {
      title: "Get Trip Details",
      description:
        "Retrieve full details for a specific trip by its ID. Returns the trip info along with its destination, flight bookings, hotel bookings, itinerary (with daily activities), and payment records. The frontend renders a rich visual card from the tool call, so when a user asks to see their trip details or wants a summary of the current trip state, call this tool — the card will show them everything at a glance.",
      inputSchema: z.object({
        tripId: z.string().describe("The unique ID of the trip to retrieve"),
      }),
    },
    async ({ tripId }) => {
      const { data, error } = await apiClient.api.trips({ id: tripId }).get();

      if (error) {
        const message =
          error.status === 404
            ? `Trip not found: ${tripId}`
            : `Failed to fetch trip: ${error.status ?? "unknown error"}`;

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
