import { DynamicStructuredTool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import {
  createFlightBookingResultSchema,
  flightSeatMapSchema,
} from "@trip-loom/contracts/dto/flights";
import { createHotelBookingResultSchema } from "@trip-loom/contracts/dto/hotel-bookings";
import type {
  CreateFlightBookingResultDTO,
  CreateHotelBookingResultDTO,
  PaymentSessionDTO,
} from "@trip-loom/contracts/dto";
import { cabinClassValues, flightTypeValues } from "@trip-loom/contracts";
import { createHotelBookingInputSchema } from "@trip-loom/contracts/dto/hotel-bookings";
import { z } from "zod";

export const bookingPaymentResumeSchema = z.object({
  status: z.enum(["paid", "cancelled"]),
});

export type BookingPaymentResume = z.infer<typeof bookingPaymentResumeSchema>;

export type BookingPaymentInterrupt =
  | {
      type: "request-booking-payment";
      bookingType: "hotel";
      booking: CreateHotelBookingResultDTO["booking"];
      paymentSession: PaymentSessionDTO;
    }
  | {
      type: "request-booking-payment";
      bookingType: "flight";
      booking: CreateFlightBookingResultDTO["booking"];
      paymentSession: PaymentSessionDTO;
    };

export type RequestSeatSelectionInterrupt = {
  type: "request-seat-selection";
  flightOptionId: string;
  offerToken: string;
  flightType: "outbound" | "inbound";
  flightNumber: string;
  airline: string;
  departureAirportCode: string;
  departureCity: string;
  departureTime: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalTime: string;
  durationMinutes: number;
  cabinClass: (typeof cabinClassValues)[number];
  priceInCents: number;
  seatMap: z.infer<typeof flightSeatMapSchema>;
};

export const seatSelectionResumeSchema = z.object({
  seatId: z.string().nullable(),
});

export type SeatSelectionResume = z.infer<typeof seatSelectionResumeSchema>;

type UnderlyingBookingTool = DynamicStructuredTool;

const createFlightBookingFlowInputSchema = z.object({
  tripId: z.string().min(1),
  type: z.enum(flightTypeValues),
  offerToken: z.string().min(1),
  flightOptionId: z.string(),
  flightNumber: z.string(),
  airline: z.string(),
  departureAirportCode: z.string(),
  departureCity: z.string(),
  departureTime: z.string(),
  arrivalAirportCode: z.string(),
  arrivalCity: z.string(),
  arrivalTime: z.string(),
  durationMinutes: z.number().int().positive(),
  cabinClass: z.enum(cabinClassValues),
  priceInCents: z.number().int().min(0),
  seatMap: flightSeatMapSchema,
});

function extractTextContent(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }

  if (!result || typeof result !== "object" || !("content" in result)) {
    return "";
  }

  const { content } = result;

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter(
      (part): part is { type?: string; text?: string } =>
        Boolean(part) && typeof part === "object",
    )
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

function parseToolJson<T>(value: unknown, schema: z.ZodSchema<T>): T {
  const text = extractTextContent(value);
  const jsonSegment = text.split("\n\n")[0] ?? text;
  return schema.parse(JSON.parse(jsonSegment));
}

function buildHotelOutcome(
  result: CreateHotelBookingResultDTO,
  status: "paid" | "cancelled",
) {
  return JSON.stringify({
    bookingType: "hotel",
    status,
    resolvedAt: new Date().toISOString(),
    booking: result.booking,
  });
}

function buildFlightOutcome(
  result: CreateFlightBookingResultDTO,
  status: "paid" | "cancelled",
) {
  return JSON.stringify({
    bookingType: "flight",
    status,
    resolvedAt: new Date().toISOString(),
    booking: result.booking,
  });
}

export function createHotelBookingFlowTool(mcpTool: UnderlyingBookingTool) {
  return new DynamicStructuredTool({
    name: mcpTool.name,
    description:
      "Create a hotel booking, then pause for payment inside the same tool flow. The tool only finishes after the user pays or cancels checkout.",
    schema: createHotelBookingInputSchema.extend({
      tripId: z.string().min(1),
    }),
    func: async (input) => {
      const result = parseToolJson(
        await mcpTool.invoke(input),
        createHotelBookingResultSchema,
      );

      const decision = bookingPaymentResumeSchema.parse(
        interrupt({
          type: "request-booking-payment",
          bookingType: "hotel",
          booking: result.booking,
          paymentSession: result.paymentSession,
        } satisfies BookingPaymentInterrupt),
      );

      return buildHotelOutcome(result, decision.status);
    },
  });
}

export function createFlightBookingFlowTool(mcpTool: UnderlyingBookingTool) {
  return new DynamicStructuredTool({
    name: mcpTool.name,
    description:
      "Create a flight booking with an in-tool seat picker and payment step. The tool pauses for seat selection first, then pauses again for checkout, and only finishes after the user pays or cancels.",
    schema: createFlightBookingFlowInputSchema,
    func: async (input) => {
      const seatDecision = seatSelectionResumeSchema.parse(
        interrupt({
          type: "request-seat-selection",
          flightOptionId: input.flightOptionId,
          offerToken: input.offerToken,
          flightType: input.type,
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
        } satisfies RequestSeatSelectionInterrupt),
      );

      if (!seatDecision.seatId) {
        return "User cancelled flight booking before choosing a seat.";
      }

      const result = parseToolJson(
        await mcpTool.invoke({
          tripId: input.tripId,
          type: input.type,
          offerToken: input.offerToken,
          seatNumber: seatDecision.seatId,
        }),
        createFlightBookingResultSchema,
      );

      const paymentDecision = bookingPaymentResumeSchema.parse(
        interrupt({
          type: "request-booking-payment",
          bookingType: "flight",
          booking: result.booking,
          paymentSession: result.paymentSession,
        } satisfies BookingPaymentInterrupt),
      );

      return buildFlightOutcome(result, paymentDecision.status);
    },
  });
}
