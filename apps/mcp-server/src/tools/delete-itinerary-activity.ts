import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerDeleteItineraryActivity(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "delete_itinerary_activity",
    {
      title: "Delete Itinerary Activity",
      description:
        "Delete an activity from a specific itinerary day. Returns the full updated itinerary detail including all days and activities.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the itinerary."),
        dayId: z.string().describe("The itinerary day ID containing the activity."),
        activityId: z.string().describe("The itinerary activity ID to delete."),
      }),
    },
    async ({ tripId, dayId, activityId }) => {
      const { data, error } = await apiClient.api
        .trips({ id: tripId })
        .itinerary.days({ dayId })
        .activities({ activityId })
        .delete();

      if (error) {
        let message =
          `Failed to delete itinerary activity: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to delete itinerary activities.";
        } else if (error.status === 404) {
          message =
            `Trip/day/activity not found for deletion (trip: ${tripId}, day: ${dayId}, activity: ${activityId}).`;
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
