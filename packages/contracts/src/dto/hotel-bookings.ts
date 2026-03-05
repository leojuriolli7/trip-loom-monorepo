import { z } from "zod";
import { bookingStatusValues, hotelRoomTypeValues } from "../enums";
import { isValidDateRange } from "../lib/date-range";

const isoDateSchema = z.string().date();

const hotelImageSchema = z.object({
  url: z.string(),
  isCover: z.boolean(),
  caption: z.string(),
});

/**
 * Hotel summary embedded in booking responses.
 */
export const hotelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  imagesUrls: z.array(hotelImageSchema).nullable(),
  rating: z.number().min(0).max(5).nullable(),
});

export type HotelSummaryDTO = z.infer<typeof hotelSummarySchema>;

/**
 * Hotel booking with embedded hotel info.
 * This is the standard response shape for all booking endpoints.
 */
export const hotelBookingSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  hotelId: z.string(),
  paymentId: z.string().nullable(),
  checkInDate: isoDateSchema,
  checkOutDate: isoDateSchema,
  roomType: z.enum(hotelRoomTypeValues),
  numberOfNights: z.number().int().positive(),
  pricePerNightInCents: z.number().int().min(0),
  totalPriceInCents: z.number().int().min(0),
  status: z.enum(bookingStatusValues),
  createdAt: z.date(),
  updatedAt: z.date(),
  hotel: hotelSummarySchema,
});

export type HotelBookingDTO = z.infer<typeof hotelBookingSchema>;

/**
 * Input for creating a hotel booking.
 * - checkOutDate must be after checkInDate
 * - numberOfNights, pricePerNightInCents, and totalPriceInCents are calculated server-side
 */
export const createHotelBookingInputSchema = z
  .object({
    hotelId: z.string().min(1),
    checkInDate: isoDateSchema,
    checkOutDate: isoDateSchema,
    roomType: z.enum(hotelRoomTypeValues),
  })
  .refine(
    (value) =>
      isValidDateRange(value.checkInDate, value.checkOutDate) &&
      value.checkInDate !== value.checkOutDate,
    {
      message: "checkOutDate must be after checkInDate",
      path: ["checkOutDate"],
    },
  );

export type CreateHotelBookingInput = z.infer<typeof createHotelBookingInputSchema>;

