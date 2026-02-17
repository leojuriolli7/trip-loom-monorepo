import { z } from "zod";
import {
  bookingStatusEnum,
  cabinClassEnum,
  flightTypeEnum,
} from "../db/schema";

export const flightBookingStatusValues = bookingStatusEnum.enumValues;
export const flightTypeValues = flightTypeEnum.enumValues;
export const flightBookingCabinClassValues = cabinClassEnum.enumValues;

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
