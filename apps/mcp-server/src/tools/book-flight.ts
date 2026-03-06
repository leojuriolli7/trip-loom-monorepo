import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { cabinClassValues, flightTypeValues } from "@trip-loom/contracts/enums";
import { z } from "zod";
import type { ApiClient } from "../api-client";

const airportCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9]{3,4}$/,
    "Airport code must be 3-4 alphanumeric characters",
  )
  .transform((value) => value.toUpperCase());

export function registerBookFlight(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "book_flight",
    {
      title: "Book Flight",
      description:
        "Create a flight booking for a trip using selected flight details. Returns the created booking record including booking status, fare amount, and flight timing metadata.",
      inputSchema: z
        .object({
          tripId: z.string().describe("The trip ID that will own the booking."),
          type: z
            .enum(flightTypeValues)
            .describe("Flight direction relative to the trip (`inbound` or `outbound`)."),
          flightNumber: z
            .string()
            .trim()
            .min(1)
            .max(24)
            .describe("Airline flight number (for example, `AA120` or `LH400`)."),
          airline: z
            .string()
            .trim()
            .min(1)
            .max(120)
            .describe("Operating airline name."),
          departureAirportCode: airportCodeSchema.describe(
            "Departure airport code (IATA/ICAO style), 3-4 alphanumeric characters.",
          ),
          departureTime: z
            .string()
            .datetime()
            .describe("Scheduled departure timestamp in ISO 8601 format."),
          arrivalAirportCode: airportCodeSchema.describe(
            "Arrival airport code (IATA/ICAO style), 3-4 alphanumeric characters.",
          ),
          arrivalTime: z
            .string()
            .datetime()
            .describe("Scheduled arrival timestamp in ISO 8601 format."),
          durationMinutes: z
            .number()
            .int()
            .positive()
            .describe("Total scheduled flight duration in minutes."),
          cabinClass: z
            .enum(cabinClassValues)
            .describe("Booked cabin class."),
          priceInCents: z
            .number()
            .int()
            .min(0)
            .describe("Total booking price in cents."),
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
        })
        .refine((value) => value.departureAirportCode !== value.arrivalAirportCode, {
          message:
            "departureAirportCode and arrivalAirportCode must be different values",
          path: ["arrivalAirportCode"],
        })
        .refine(
          (value) =>
            new Date(value.arrivalTime).getTime() >
            new Date(value.departureTime).getTime(),
          {
            message: "arrivalTime must be after departureTime",
            path: ["arrivalTime"],
          },
        ),
    },
    async ({
      tripId,
      type,
      flightNumber,
      airline,
      departureAirportCode,
      departureTime,
      arrivalAirportCode,
      arrivalTime,
      durationMinutes,
      cabinClass,
      priceInCents,
      seatNumber,
    }) => {
      const { data, error, status: httpStatus } = await apiClient.api.trips({ id: tripId }).flights.post({
        type,
        flightNumber,
        airline,
        departureAirportCode,
        departureTime,
        arrivalAirportCode,
        arrivalTime,
        durationMinutes,
        cabinClass,
        priceInCents,
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

      const isExisting = httpStatus === 200;
      const prefix = isExisting
        ? "Returned existing pending booking (already booked this flight for this trip). Do NOT create another booking.\n\n"
        : "";

      return {
        content: [
          { type: "text" as const, text: `${prefix}${JSON.stringify(data, null, 2)}` },
        ],
      };
    },
  );
}
