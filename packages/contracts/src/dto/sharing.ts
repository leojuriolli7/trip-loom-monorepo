import { z } from "zod";
import {
  bookingStatusValues,
  cabinClassValues,
  flightTypeValues,
  hotelRoomTypeValues,
  tripStatusValues,
} from "../enums";
import { destinationSchema } from "./destinations";
import { itineraryDetailSchema } from "./itineraries";

const isoDateSchema = z.string().date();
const isoDateTimeSchema = z.iso.datetime();

const destinationSummarySchema = destinationSchema
  .pick({
    id: true,
    name: true,
    country: true,
    countryCode: true,
    imagesUrls: true,
  })
  .nullable();

const hotelImageSchema = z.object({
  url: z.string(),
  isCover: z.boolean(),
  caption: z.string(),
});

/**
 * Flight booking summary for shared trips.
 * Strips paymentId, priceInCents, seatNumber, and other sensitive fields.
 */
export const sharedFlightBookingSchema = z.object({
  id: z.string(),
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
  cabinClass: z.enum(cabinClassValues),
  status: z.enum(bookingStatusValues),
});

export type SharedFlightBookingDTO = z.infer<typeof sharedFlightBookingSchema>;

/**
 * Hotel summary embedded in shared booking responses.
 */
const sharedHotelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  imagesUrls: z.array(hotelImageSchema).nullable(),
  rating: z.number().min(0).max(5).nullable(),
});

/**
 * Hotel booking summary for shared trips.
 * Strips paymentId, pricing data, and other sensitive fields.
 */
export const sharedHotelBookingSchema = z.object({
  id: z.string(),
  hotelId: z.string(),
  checkInDate: isoDateSchema,
  checkOutDate: isoDateSchema,
  roomType: z.enum(hotelRoomTypeValues),
  numberOfNights: z.number().int().positive(),
  status: z.enum(bookingStatusValues),
  hotel: sharedHotelSummarySchema,
});

export type SharedHotelBookingDTO = z.infer<typeof sharedHotelBookingSchema>;

/**
 * Shared trip response schema.
 * Contains only public-safe information, no payment data, user IDs, or Stripe secrets.
 */
export const sharedTripSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  status: z.enum(tripStatusValues),
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  destination: destinationSummarySchema,
  flightBookings: z.array(sharedFlightBookingSchema),
  hotelBookings: z.array(sharedHotelBookingSchema),
  itinerary: itineraryDetailSchema.nullable(),
});

export type SharedTripDTO = z.infer<typeof sharedTripSchema>;

/**
 * Share trip response (returned when enabling sharing).
 */
export const shareTripResponseSchema = z.object({
  shareToken: z.string(),
  shareUrl: z.string().url(),
});

export type ShareTripResponseDTO = z.infer<typeof shareTripResponseSchema>;

/**
 * Share token status (returned when checking share status).
 */
export const shareTokenStatusSchema = z.object({
  shareToken: z.string().nullable(),
});

export type ShareTokenStatusDTO = z.infer<typeof shareTokenStatusSchema>;
