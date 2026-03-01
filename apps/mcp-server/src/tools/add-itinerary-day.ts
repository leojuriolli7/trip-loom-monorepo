import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerAddItineraryDay(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "add_itinerary_day",
    {
      title: "Add Itinerary Day",
      description:
        "Add a day to an existing itinerary for a trip. Returns the full updated itinerary detail including all days and activities.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the itinerary."),
        dayNumber: z
          .number()
          .int()
          .positive()
          .describe("Day number in itinerary sequence (1-based)."),
        date: z
          .string()
          .date()
          .describe("Date for the itinerary day in YYYY-MM-DD format."),
        title: z
          .string()
          .min(1)
          .max(200)
          .optional()
          .describe("Optional day title."),
        notes: z
          .string()
          .max(5000)
          .optional()
          .describe("Optional notes for this day."),
      }),
    },
    async ({ tripId, dayNumber, date, title, notes }) => {
      const { data, error } = await apiClient.api
        .trips({ id: tripId })
        .itinerary.days.post({
          dayNumber,
          date,
          title,
          notes,
        });

      if (error) {
        let message = `Failed to add itinerary day: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to update itinerary days.";
        } else if (error.status === 404) {
          message =
            `Trip or itinerary not found for trip ${tripId}. ` +
            "Create an itinerary before adding days.";
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
