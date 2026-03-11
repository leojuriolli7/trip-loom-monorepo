import { z } from "zod";
import {
  bookingStatusValues,
  cabinClassValues,
  flightTypeValues,
} from "../enums";
import { paymentSessionSchema } from "./payments";

const airportCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9]{3,4}$/,
    "Airport code must be 3-4 alphanumeric characters",
  )
  .transform((value) => value.toUpperCase());

const seatNumberSchema = z.string().trim().min(1).max(12);
const isoDateTimeSchema = z.iso.datetime();

export const airportSummarySchema = z.object({
  code: airportCodeSchema,
  name: z.string(),
  city: z.string().nullable(),
  countryCode: z.string().length(2),
  timezone: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export type AirportSummaryDTO = z.infer<typeof airportSummarySchema>;

export const flightSeatSchema = z.object({
  id: z.string().min(2).max(8),
  isBooked: z.boolean(),
});

export const flightSeatRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  sections: z.array(z.array(flightSeatSchema).min(1)).min(1),
});

export const flightSeatMapSchema = z.array(flightSeatRowSchema);

export type FlightSeat = z.infer<typeof flightSeatSchema>;
export type FlightSeatRow = z.infer<typeof flightSeatRowSchema>;
export type FlightSeatMap = z.infer<typeof flightSeatMapSchema>;

export const flightSearchSchema = z
  .object({
    from: airportCodeSchema,
    to: airportCodeSchema,
    date: z.iso.date(),
    cabinClass: z.enum(cabinClassValues).default("economy"),
    passengers: z.coerce.number().int().min(1).max(9).default(1),
  })
  .refine((value) => value.from !== value.to, {
    message: "`from` and `to` airport codes must be different",
    path: ["to"],
  });

export type FlightSearchQuery = z.infer<typeof flightSearchSchema>;

export const flightOptionSchema = z.object({
  id: z.string(),
  offerToken: z.string(),
  priceInCents: z.number().int().min(0),
  flightNumber: z.string(),
  airline: z.string(),
  departureAirportCode: z.string(),
  departureCity: z.string(),
  departureAirport: airportSummarySchema,
  departureTime: isoDateTimeSchema,
  arrivalAirportCode: z.string(),
  arrivalCity: z.string(),
  arrivalAirport: airportSummarySchema,
  arrivalTime: isoDateTimeSchema,
  durationMinutes: z.number().int().positive(),
  cabinClass: z.enum(cabinClassValues),
  availableSeats: z.number().int().nonnegative(),
  seatMap: flightSeatMapSchema,
});

export type FlightOptionDTO = z.infer<typeof flightOptionSchema>;

export const flightBookingSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  paymentId: z.string().nullable(),
  type: z.enum(flightTypeValues),
  flightNumber: z.string(),
  airline: z.string(),
  departureAirportCode: z.string(),
  departureCity: z.string(),
  departureTime: isoDateTimeSchema,
  arrivalAirportCode: z.string(),
  arrivalCity: z.string(),
  arrivalTime: isoDateTimeSchema,
  durationMinutes: z.number().int().positive(),
  seatNumber: z.string().nullable(),
  cabinClass: z.enum(cabinClassValues),
  priceInCents: z.number().int().min(0),
  status: z.enum(bookingStatusValues),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type FlightBookingDTO = z.infer<typeof flightBookingSchema>;

export const flightBookingDetailSchema = flightBookingSchema.extend({
  seatMap: flightSeatMapSchema,
  departureAirport: airportSummarySchema,
  arrivalAirport: airportSummarySchema,
});

export type FlightBookingDetailDTO = z.infer<typeof flightBookingDetailSchema>;

export const createFlightBookingInputSchema = z
  .object({
    type: z.enum(flightTypeValues),
    offerToken: z.string().trim().min(1),
    seatNumber: seatNumberSchema.nullable().optional(),
  });

export type CreateFlightBookingInput = z.infer<
  typeof createFlightBookingInputSchema
>;

export const createFlightBookingResultSchema = z.object({
  booking: flightBookingDetailSchema,
  paymentSession: paymentSessionSchema,
});

export type CreateFlightBookingResultDTO = z.infer<
  typeof createFlightBookingResultSchema
>;
