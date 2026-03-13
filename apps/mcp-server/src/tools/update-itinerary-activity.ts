import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";
import { updateItineraryActivityInputSchema } from "./shared/itinerary-activity-schemas";

export function registerUpdateItineraryActivity(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "update_itinerary_activity",
    {
      title: "Update Itinerary Activity",
      description:
        "Update an existing itinerary activity on a specific day. Supports optional Google Maps place metadata from search_places/get_place_details and returns the full updated itinerary detail.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the itinerary."),
        dayId: z.string().describe("The itinerary day ID containing the activity."),
        activityId: z.string().describe("The itinerary activity ID to update."),
        ...updateItineraryActivityInputSchema.shape,
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
      googlePlaceId,
      googlePlaceDisplayName,
      googleMapsUrl,
      googleFormattedAddress,
      googleLat,
      googleLng,
      estimatedCostInCents,
      imageUrl,
      sourceUrl,
      sourceName,
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
          googlePlaceId,
          googlePlaceDisplayName,
          googleMapsUrl,
          googleFormattedAddress,
          googleLat,
          googleLng,
          estimatedCostInCents,
          imageUrl,
          sourceUrl,
          sourceName,
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
