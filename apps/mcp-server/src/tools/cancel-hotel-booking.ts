import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerCancelHotelBooking(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "cancel_hotel_booking",
    {
      title: "Cancel Hotel Booking",
      description:
        "Cancel an existing hotel booking for a trip. Marks the booking as cancelled in TripLoom and returns a successful completion message.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the hotel booking."),
        hotelBookingId: z
          .string()
          .describe("The hotel booking ID to cancel."),
      }),
    },
    async ({ tripId, hotelBookingId }) => {
      const { error } = await apiClient.api
        .trips({ id: tripId })
        .hotels({ hotelBookingId })
        .delete();

      if (error) {
        let message = `Failed to cancel hotel booking: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to cancel a hotel booking.";
        } else if (error.status === 404) {
          message = `Hotel booking not found for trip ${tripId}: ${hotelBookingId}`;
        }

        return {
          isError: true as const,
          content: [{ type: "text" as const, text: message }],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Hotel booking cancelled: ${hotelBookingId} (trip ${tripId})`,
          },
        ],
      };
    },
  );
}
