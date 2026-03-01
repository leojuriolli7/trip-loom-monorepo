import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { cabinClassValues } from "@trip-loom/api/enums";
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

export function registerSearchFlights(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "search_flights",
    {
      title: "Search Flights",
      description:
        "Search available flights for an origin, destination, and travel date. Returns structured flight options with schedules, airport metadata, seat-map availability, and a suggested seat identifier.",
      inputSchema: z.object({
        from: airportCodeSchema.describe(
          "Departure airport code (IATA/ICAO style), 3-4 alphanumeric characters.",
        ),
        to: airportCodeSchema.describe(
          "Arrival airport code (IATA/ICAO style), 3-4 alphanumeric characters.",
        ),
        date: z
          .string()
          .date()
          .describe("Travel date in YYYY-MM-DD format."),
        cabinClass: z
          .enum(cabinClassValues)
          .default("economy")
          .describe(
            "Requested cabin class for pricing and seat-map generation. Defaults to `economy`.",
          ),
        passengers: z
          .number()
          .int()
          .min(1)
          .max(9)
          .default(1)
          .describe(
            "Number of passengers to search for. Allowed range is 1-9. Defaults to 1.",
          ),
      }),
    },
    async ({ from, to, date, cabinClass, passengers }) => {
      const { data, error } = await apiClient.api.flights.search.get({
        query: { from, to, date, cabinClass, passengers },
      });

      if (error) {
        let message = `Failed to search flights: ${error.status ?? "unknown error"}`;

        if (error.status === 400) {
          message =
            "Invalid flight search parameters or unknown airport code in the selected route.";
        } else if (error.status === 401) {
          message = "User is not authenticated to search flights.";
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
