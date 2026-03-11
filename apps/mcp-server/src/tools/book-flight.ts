import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { flightTypeValues } from "@trip-loom/contracts/enums";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerBookFlight(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "create_flight_booking",
    {
      title: "Create Flight Booking",
      description:
        "Create a pending flight booking for a trip from a previously returned flight offer token. Returns booking details together with a payment session and checkout URL.",
      inputSchema: z
        .object({
          tripId: z.string().describe("The trip ID that will own the booking."),
          type: z
            .enum(flightTypeValues)
            .describe("Flight direction relative to the trip (`inbound` or `outbound`)."),
          offerToken: z
            .string()
            .min(1)
            .describe("Opaque flight offer token returned from `search_flights`."),
          seatNumber: z
            .string()
            .trim()
            .min(1)
            .max(12)
            .nullable()
            .optional()
            .describe(
              "Optional selected seat number/identifier. Use `null` to create booking without a seat assignment.",
            ),
        }),
    },
    async ({
      tripId,
      type,
      offerToken,
      seatNumber,
    }) => {
      const { data, error } = await apiClient.api.trips({ id: tripId }).flights.post({
        type,
        offerToken,
        seatNumber,
      });

      if (error) {
        let message = `Failed to create flight booking: ${error.status ?? "unknown error"}`;

        if (error.status === 400) {
          message =
            "Invalid flight booking payload (for example, unknown airport code or inconsistent schedule values).";
        } else if (error.status === 401) {
          message = "User is not authenticated to create a flight booking.";
        } else if (error.status === 404) {
          message = `Trip not found: ${tripId}`;
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
