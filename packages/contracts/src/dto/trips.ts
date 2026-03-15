import { z } from "zod";
import { tripStatusValues } from "../enums";
import { isValidDateRange } from "../lib/date-range";
import { paginationQuerySchema } from "../lib/pagination";
import { arrayQueryParam } from "./common";
import { destinationSchema } from "./destinations";
import { flightBookingSchema, type FlightBookingDTO } from "./flights";
import { hotelBookingSchema, type HotelBookingDTO } from "./hotel-bookings";
import {
  itineraryDetailSchema,
  type ItineraryActivityDTO,
  type ItineraryDayDTO,
  type ItineraryDetailDTO,
} from "./itineraries";
import { paymentSchema, type PaymentDTO } from "./payments";

const isoDateSchema = z.string().date();

const destinationSummarySchema = destinationSchema
  .pick({
    id: true,
    name: true,
    country: true,
    countryCode: true,
    imagesUrls: true,
  })
  .nullable();

export type DestinationSummaryDTO = z.infer<typeof destinationSummarySchema>;

export const tripSchema = z.object({
  id: z.string(),
  userId: z.string(),
  destinationId: z.string().nullable(),
  title: z.string().nullable(),
  archived: z.boolean(),
  status: z.enum(tripStatusValues),
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TripDTO = z.infer<typeof tripSchema>;

export const tripWithDestinationSchema = tripSchema.extend({
  destination: destinationSummarySchema,
  hasFlights: z.boolean(),
  hasHotel: z.boolean(),
  hasItinerary: z.boolean(),
});

export type TripWithDestinationDTO = z.infer<typeof tripWithDestinationSchema>;

export const tripDetailSchema = tripWithDestinationSchema.extend({
  flightBookings: z.array(flightBookingSchema),
  hotelBookings: z.array(hotelBookingSchema),
  itinerary: itineraryDetailSchema.nullable(),
  payments: z.array(paymentSchema),
});

export type TripDetailDTO = z.infer<typeof tripDetailSchema>;

export type TripFlightBookingDTO = FlightBookingDTO;
export type TripHotelBookingDTO = HotelBookingDTO;
export type TripPaymentDTO = PaymentDTO;
export type { ItineraryActivityDTO, ItineraryDayDTO, ItineraryDetailDTO };

export const createTripInputSchema = z
  .object({
    destinationId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(120).nullable().optional(),
    startDate: isoDateSchema.nullable().optional(),
    endDate: isoDateSchema.nullable().optional(),
  })
  .refine((value) => isValidDateRange(value.startDate, value.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export type CreateTripInput = z.infer<typeof createTripInputSchema>;

export const updateTripInputSchema = z
  .object({
    destinationId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(120).nullable().optional(),
    archived: z.boolean().optional(),
    startDate: isoDateSchema.nullable().optional(),
    endDate: isoDateSchema.nullable().optional(),
  })
  .refine((value) => isValidDateRange(value.startDate, value.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export type UpdateTripInput = z.infer<typeof updateTripInputSchema>;

export const tripQuerySchema = paginationQuerySchema.extend({
  status: arrayQueryParam(z.enum(tripStatusValues)),
  destinationId: z.string().min(1).optional(),
  archived: z.stringbool().optional(),
});

export type TripQuery = z.infer<typeof tripQuerySchema>;
