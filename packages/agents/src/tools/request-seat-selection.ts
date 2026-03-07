import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { cabinClassValues } from "@trip-loom/contracts";
import { flightSeatMapSchema } from "@trip-loom/contracts/dto/flights";
import { z } from "zod";

const requestSeatSelectionInputSchema = z.object({
  flightOptionId: z.string().describe("The flight option ID from search results"),
  flightNumber: z.string().describe("Flight number (e.g. AA1234)"),
  airline: z.string().describe("Airline name"),
  departureAirportCode: z.string().describe("Departure airport IATA code"),
  departureCity: z.string().describe("Departure city name"),
  departureTime: z.string().describe("Departure time (ISO 8601)"),
  arrivalAirportCode: z.string().describe("Arrival airport IATA code"),
  arrivalCity: z.string().describe("Arrival city name"),
  arrivalTime: z.string().describe("Arrival time (ISO 8601)"),
  durationMinutes: z.number().describe("Flight duration in minutes"),
  cabinClass: z.enum(cabinClassValues).describe("Cabin class"),
  priceInCents: z
    .number()
    .int()
    .min(0)
    .describe("Total flight price in cents from search results"),
  seatMap: flightSeatMapSchema.describe("Full seat map for the picker widget"),
});

export type RequestSeatSelectionInput = z.infer<
  typeof requestSeatSelectionInputSchema
>;

export type RequestSeatSelectionInterrupt = {
  type: "request-seat-selection";
} & RequestSeatSelectionInput;

export const requestSeatSelectionResumeSchema = z.object({
  seatId: z.string().nullable(),
});

export type RequestSeatSelectionResume = z.infer<
  typeof requestSeatSelectionResumeSchema
>;

export type RequestSeatSelectionToolResult = {
  type: "request-seat-selection-result";
  seatId: string | null;
};

/**
 * Presents the seat picker widget to the user for a specific flight.
 * Interrupts the graph and waits for the user to select a seat or skip.
 * Resumes with { seatId }.
 */
export const requestSeatSelectionTool = tool(
  async (input) => {
    const event: RequestSeatSelectionInterrupt = {
      type: "request-seat-selection",
      flightOptionId: input.flightOptionId,
      flightNumber: input.flightNumber,
      airline: input.airline,
      departureAirportCode: input.departureAirportCode,
      departureCity: input.departureCity,
      departureTime: input.departureTime,
      arrivalAirportCode: input.arrivalAirportCode,
      arrivalCity: input.arrivalCity,
      arrivalTime: input.arrivalTime,
      durationMinutes: input.durationMinutes,
      cabinClass: input.cabinClass,
      priceInCents: input.priceInCents,
      seatMap: input.seatMap,
    };

    const response = requestSeatSelectionResumeSchema.parse(interrupt(event));

    const result: RequestSeatSelectionToolResult = {
      type: "request-seat-selection-result",
      seatId: response.seatId,
    };

    if (response.seatId) {
      return `${JSON.stringify(result)}\n\nUser selected seat ${response.seatId}. Book the flight with seatNumber: "${response.seatId}".`;
    }

    return `${JSON.stringify(result)}\n\nUser skipped seat selection. Book the flight with seatNumber: null.`;
  },
  {
    name: "request_seat_selection",
    description:
      "Present the seat picker widget to the user for a specific flight. Use this after the user picks a flight from suggest_flight, before calling book_flight. Pass the FULL flight option data including seatMap from search results. The graph will pause until the user selects a seat or skips.",
    schema: requestSeatSelectionInputSchema,
  },
);
