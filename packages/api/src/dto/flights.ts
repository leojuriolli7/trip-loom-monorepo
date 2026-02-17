import { z } from "zod";
import {
  bookingStatusEnum,
  cabinClassEnum,
  flightTypeEnum,
} from "../db/schema";

const airportCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9]{3,4}$/,
    "Airport code must be 3-4 alphanumeric characters",
  )
  .transform((value) => value.toUpperCase());

const seatNumberSchema = z.string().trim().min(1).max(12);

export const flightBookingStatusValues = bookingStatusEnum.enumValues;
export const flightTypeValues = flightTypeEnum.enumValues;
export const flightBookingCabinClassValues = cabinClassEnum.enumValues;

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
  priceInCents: z.number().int().min(0),
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
    date: z.string().date(),
    cabinClass: z.enum(flightBookingCabinClassValues).default("economy"),
    passengers: z.coerce.number().int().min(1).max(9).default(1),
  })
  .refine((value) => value.from !== value.to, {
    message: "`from` and `to` airport codes must be different",
    path: ["to"],
  });

export type FlightSearchQuery = z.infer<typeof flightSearchSchema>;

export const flightOptionSchema = z.object({
  id: z.string(),
  flightNumber: z.string(),
  airline: z.string(),
  departureAirportCode: z.string(),
  departureCity: z.string(),
  departureAirport: airportSummarySchema,
  departureTime: z.string().datetime(),
  arrivalAirportCode: z.string(),
  arrivalCity: z.string(),
  arrivalAirport: airportSummarySchema,
  arrivalTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  cabinClass: z.enum(flightBookingCabinClassValues),
  priceInCents: z.number().int().min(0),
  availableSeats: z.number().int().nonnegative(),
  seatMap: flightSeatMapSchema,
  suggestedSeatId: z.string().nullable(),
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
  departureTime: z.date(),
  arrivalAirportCode: z.string(),
  arrivalCity: z.string(),
  arrivalTime: z.date(),
  durationMinutes: z.number().int().positive(),
  seatNumber: z.string().nullable(),
  cabinClass: z.enum(flightBookingCabinClassValues),
  priceInCents: z.number().int().min(0),
  status: z.enum(flightBookingStatusValues),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FlightBookingDTO = z.infer<typeof flightBookingSchema>;

export const flightBookingDetailSchema = flightBookingSchema.extend({
  seatMap: flightSeatMapSchema,
  suggestedSeatId: z.string().nullable(),
  departureAirport: airportSummarySchema,
  arrivalAirport: airportSummarySchema,
});

export type FlightBookingDetailDTO = z.infer<typeof flightBookingDetailSchema>;

export const createFlightBookingInputSchema = z
  .object({
    type: z.enum(flightTypeValues),
    flightNumber: z.string().trim().min(1).max(24),
    airline: z.string().trim().min(1).max(120),
    departureAirportCode: airportCodeSchema,
    departureCity: z.string().trim().min(1).max(120).optional(),
    departureTime: z.string().datetime(),
    arrivalAirportCode: airportCodeSchema,
    arrivalCity: z.string().trim().min(1).max(120).optional(),
    arrivalTime: z.string().datetime(),
    durationMinutes: z.number().int().positive(),
    cabinClass: z.enum(flightBookingCabinClassValues),
    priceInCents: z.number().int().min(0),
    seatNumber: seatNumberSchema.nullable().optional(),
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
  );

export type CreateFlightBookingInput = z.infer<
  typeof createFlightBookingInputSchema
>;

export const updateFlightBookingInputSchema = z.object({
  seatNumber: seatNumberSchema.nullable().optional(),
  status: z.enum(flightBookingStatusValues).optional(),
});

export type UpdateFlightBookingInput = z.infer<
  typeof updateFlightBookingInputSchema
>;
