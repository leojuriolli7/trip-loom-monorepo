import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";
import { createItineraryActivityInputSchema } from "./shared/itinerary-activity-schemas";

export function registerAddItineraryActivity(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "add_itinerary_activity",
    {
      title: "Add Itinerary Activity",
      description:
        "Add an activity to a specific itinerary day within a trip. Supports optional Google Maps place metadata from search_places/get_place_details and returns the full updated itinerary detail.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the itinerary."),
        dayId: z.string().describe("The itinerary day ID that will receive the activity."),
        ...createItineraryActivityInputSchema.shape,
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
        .activities.post({
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
