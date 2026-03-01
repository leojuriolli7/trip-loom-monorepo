import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerCancelFlightBooking(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "cancel_flight_booking",
    {
      title: "Cancel Flight Booking",
      description:
        "Cancel an existing flight booking for a trip. Marks the booking as cancelled in TripLoom and returns a successful completion message.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID that owns the flight booking."),
        flightBookingId: z
          .string()
          .describe("The flight booking ID to cancel."),
      }),
    },
    async ({ tripId, flightBookingId }) => {
      const { error } = await apiClient.api
        .trips({ id: tripId })
        .flights({ flightId: flightBookingId })
        .delete();

      if (error) {
        let message = `Failed to cancel flight booking: ${error.status ?? "unknown error"}`;

        if (error.status === 401) {
          message = "User is not authenticated to cancel a flight booking.";
        } else if (error.status === 404) {
          message = `Flight booking not found for trip ${tripId}: ${flightBookingId}`;
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
            text: `Flight booking cancelled: ${flightBookingId} (trip ${tripId})`,
          },
        ],
      };
    },
  );
}
