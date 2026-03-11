import { z } from "zod";
import { flightBookingDetailSchema } from "./flights";
import { hotelBookingSchema } from "./hotel-bookings";

const bookingPaymentStatusSchema = z.enum(["paid", "cancelled"]);

export const hotelBookingPaymentOutcomeSchema = z.object({
  bookingType: z.literal("hotel"),
  status: bookingPaymentStatusSchema,
  resolvedAt: z.iso.datetime(),
  booking: hotelBookingSchema,
});

export type HotelBookingPaymentOutcomeDTO = z.infer<
  typeof hotelBookingPaymentOutcomeSchema
>;

export const flightBookingPaymentOutcomeSchema = z.object({
  bookingType: z.literal("flight"),
  status: bookingPaymentStatusSchema,
  resolvedAt: z.iso.datetime(),
  booking: flightBookingDetailSchema,
});

export type FlightBookingPaymentOutcomeDTO = z.infer<
  typeof flightBookingPaymentOutcomeSchema
>;
