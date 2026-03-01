import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { hotelRoomTypeValues } from "@trip-loom/api/enums";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerCreateHotelBooking(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "create_hotel_booking",
    {
      title: "Create Hotel Booking",
      description:
        "Create a pending hotel booking for a trip. Returns the created booking including selected room type, computed pricing totals, booking status, and embedded hotel summary.",
      inputSchema: z
        .object({
          tripId: z.string().describe("The trip ID that will own the booking."),
          hotelId: z
            .string()
            .min(1)
            .describe("The hotel ID to book."),
          checkInDate: z
            .string()
            .date()
            .describe("Hotel check-in date in YYYY-MM-DD format."),
          checkOutDate: z
            .string()
            .date()
            .describe("Hotel check-out date in YYYY-MM-DD format."),
          roomType: z
            .enum(hotelRoomTypeValues)
            .describe("Requested hotel room type."),
        })
        .refine((value) => value.checkOutDate > value.checkInDate, {
          message: "checkOutDate must be after checkInDate",
          path: ["checkOutDate"],
        }),
    },
    async ({ tripId, hotelId, checkInDate, checkOutDate, roomType }) => {
      const { data, error } = await apiClient.api.trips({ id: tripId }).hotels.post({
        hotelId,
        checkInDate,
        checkOutDate,
        roomType,
      });

      if (error) {
        let message = `Failed to create hotel booking: ${error.status ?? "unknown error"}`;

        if (error.status === 400) {
          message =
            "Invalid hotel booking payload (for example, invalid date range or unsupported room type).";
        } else if (error.status === 401) {
          message = "User is not authenticated to create a hotel booking.";
        } else if (error.status === 404) {
          message = `Trip or hotel not found for booking request (trip: ${tripId}, hotel: ${hotelId}).`;
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
