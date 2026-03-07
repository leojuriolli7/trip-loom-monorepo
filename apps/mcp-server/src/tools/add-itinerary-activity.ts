import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, expected HH:mm");

export function registerAddItineraryActivity(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "add_itinerary_activity",
    {
      title: "Add Itinerary Activity",
      description:
        "Add an activity to a specific itinerary day within a trip. Returns the full updated itinerary detail including all days and activities.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the itinerary."),
        dayId: z.string().describe("The itinerary day ID that will receive the activity."),
        orderIndex: z
          .number()
          .int()
          .min(0)
          .describe("Zero-based order position for the activity in the day."),
        title: z.string().min(1).max(200).describe("Activity title."),
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
        imageUrl: z
          .string()
          .url()
          .max(2000)
          .optional()
          .describe("Optional image URL for this activity."),
        sourceUrl: z
          .string()
          .url()
          .max(2000)
          .optional()
          .describe("Optional source URL where activity info was found."),
        sourceName: z
          .string()
          .max(200)
          .optional()
          .describe("Optional source name (e.g. 'TripAdvisor', 'Lonely Planet')."),
      }),
    },
    async ({
      tripId,
      dayId,
      orderIndex,
      title,
      description,
      startTime,
      endTime,
      location,
      locationUrl,
      estimatedCostInCents,
      imageUrl,
      sourceUrl,
      sourceName,
    }) => {
      const { data, error } = await apiClient.api
        .trips({ id: tripId })
        .itinerary.days({ dayId })
        .activities.post({
          orderIndex,
          title,
          description,
          startTime,
          endTime,
          location,
          locationUrl,
          estimatedCostInCents,
          imageUrl,
          sourceUrl,
          sourceName,
        });

      if (error) {
        let message =
          `Failed to add itinerary activity: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to update itinerary activities.";
        } else if (error.status === 404) {
          message =
            `Trip/day not found for activity insertion (trip: ${tripId}, day: ${dayId}).`;
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
