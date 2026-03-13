import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";
import { createItineraryActivityInputSchema } from "./shared/itinerary-activity-schemas";

const dayInputSchema = z.object({
  dayNumber: z
    .number()
    .int()
    .positive()
    .describe("Day number in itinerary sequence (1-based)."),
  date: z.string().date().describe("Day date in YYYY-MM-DD format."),
  title: z.string().min(1).max(200).optional().describe("Optional day title."),
  notes: z
    .string()
    .max(5000)
    .optional()
    .describe("Optional notes for the itinerary day."),
  activities: z
    .array(createItineraryActivityInputSchema)
    .optional()
    .describe("Optional activities to create for this day."),
});

export function registerCreateItinerary(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "create_itinerary",
    {
      title: "Create Itinerary",
      description:
        "Create an itinerary for a trip. Supports creating nested days and activities in the same request. Activities can include optional Google Maps place metadata from search_places/get_place_details so the saved itinerary is map-ready.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that will own the itinerary."),
        days: z
          .array(dayInputSchema)
          .optional()
          .describe("Optional list of days (with optional nested activities)."),
      }),
    },
    async ({ tripId, days }) => {
      const normalizedDays = (days ?? []).map((day) => ({
        ...day,
        activities: day.activities ?? [],
      }));

      const { data, error } = await apiClient.api.trips({ id: tripId }).itinerary.post({
        days: normalizedDays,
      });

      if (error) {
        let message = `Failed to create itinerary: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to create an itinerary.";
        } else if (error.status === 404) {
          message = `Trip not found: ${tripId}`;
        } else if (error.status === 409) {
          message = `Itinerary already exists for trip ${tripId}.`;
        }

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
