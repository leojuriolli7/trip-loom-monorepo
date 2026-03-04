import { tool } from "@langchain/core/tools";
import { z } from "zod";

const schema = z.object({
  flights: z
    .array(
      z.object({
        id: z.string().describe("The flight booking ID or search result ID"),
        airline: z.string().describe("Airline name"),
        origin: z.string().describe("Departure airport or city"),
        destination: z.string().describe("Arrival airport or city"),
        departureTime: z.string().describe("Departure time (ISO 8601)"),
        arrivalTime: z.string().describe("Arrival time (ISO 8601)"),
        price: z.number().describe("Price in the given currency"),
        currency: z.string().describe("Currency code (e.g. USD, EUR)"),
        stops: z.number().describe("Number of stops (0 for direct)"),
      }),
    )
    .min(1)
    .describe("The list of flights to present to the user"),
});

/**
 * Records flight suggestions via the tool-call trace.
 * Call this after searching flights so the frontend can render
 * structured tool-call payloads from persisted history.
 */
export const suggestFlightTool = tool(
  async (input) => {
    return `Presented ${input.flights.length} flight option(s) to the user for selection.`;
  },
  {
    name: "suggest_flight",
    description:
      "Present flight options to the user as a visual comparison widget. Use this after searching flights to let the user compare and pick one. After calling this tool, avoid restating all card details in plain text.",
    schema,
  },
);
