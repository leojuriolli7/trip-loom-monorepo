import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerConfirmHotelBooking(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "confirm_hotel_booking",
    {
      title: "Confirm Hotel Booking",
      description:
        "Confirm an existing hotel booking by updating its status to `confirmed`. Returns the updated hotel booking record.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the hotel booking."),
        hotelBookingId: z
          .string()
          .describe("The hotel booking ID to confirm."),
      }),
    },
    async ({ tripId, hotelBookingId }) => {
      const { data, error } = await apiClient.api
        .trips({ id: tripId })
        .hotels({ hotelBookingId })
        .patch({ status: "confirmed" });

      if (error) {
        let message = `Failed to confirm hotel booking: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to confirm a hotel booking.";
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
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );
}
