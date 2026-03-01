import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, expected HH:mm");

export function registerUpdateItineraryActivity(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "update_itinerary_activity",
    {
      title: "Update Itinerary Activity",
      description:
        "Update an existing itinerary activity on a specific day. Returns the full updated itinerary detail including all days and activities.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the itinerary."),
        dayId: z.string().describe("The itinerary day ID containing the activity."),
        activityId: z.string().describe("The itinerary activity ID to update."),
        orderIndex: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Optional new order position in the day."),
        title: z
          .string()
          .min(1)
          .max(200)
          .optional()
          .describe("Optional new activity title."),
        description: z
          .string()
          .max(2000)
          .nullable()
          .optional()
          .describe("Optional new description; use null to clear."),
        startTime: timeSchema
          .nullable()
          .optional()
          .describe("Optional new start time (HH:mm); use null to clear."),
        endTime: timeSchema
          .nullable()
          .optional()
          .describe("Optional new end time (HH:mm); use null to clear."),
        location: z
          .string()
          .max(500)
          .nullable()
          .optional()
          .describe("Optional new location; use null to clear."),
        locationUrl: z
          .string()
          .url()
          .max(2000)
          .nullable()
          .optional()
          .describe("Optional new location URL; use null to clear."),
        estimatedCostInCents: z
          .number()
          .int()
          .min(0)
          .nullable()
          .optional()
          .describe("Optional new estimated cost in cents; use null to clear."),
      }),
    },
    async ({
      tripId,
      dayId,
      activityId,
      orderIndex,
      title,
      description,
      startTime,
      endTime,
      location,
      locationUrl,
      estimatedCostInCents,
    }) => {
      const { data, error } = await apiClient.api
        .trips({ id: tripId })
        .itinerary.days({ dayId })
        .activities({ activityId })
        .patch({
          orderIndex,
          title,
          description,
          startTime,
          endTime,
          location,
          locationUrl,
          estimatedCostInCents,
        });

      if (error) {
        let message =
          `Failed to update itinerary activity: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to update itinerary activities.";
        } else if (error.status === 404) {
          message =
            `Trip/day/activity not found for update (trip: ${tripId}, day: ${dayId}, activity: ${activityId}).`;
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
