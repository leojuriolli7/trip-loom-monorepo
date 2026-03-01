import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, expected HH:mm");

const activityInputSchema = z.object({
  orderIndex: z
    .number()
    .int()
    .min(0)
    .describe("Zero-based order of this activity within the day."),
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Activity title."),
  description: z
    .string()
    .max(2000)
    .optional()
    .describe("Optional activity description."),
  startTime: timeSchema.optional().describe("Optional start time in HH:mm format."),
  endTime: timeSchema.optional().describe("Optional end time in HH:mm format."),
  location: z
    .string()
    .max(500)
    .optional()
    .describe("Optional activity location label."),
  locationUrl: z
    .string()
    .url()
    .max(2000)
    .optional()
    .describe("Optional external location URL."),
  estimatedCostInCents: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Optional estimated activity cost in cents."),
});

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
    .array(activityInputSchema)
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
        "Create an itinerary for a trip. Supports creating nested days and activities in the same request, and returns the full itinerary detail.",
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
