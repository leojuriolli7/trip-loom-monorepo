import { z } from "zod";
import { bookingStatusValues } from "../enums";
import { isValidDateRange } from "../lib/date-range";

const isoDateSchema = z.string().date();

/**
 * Hotel summary embedded in booking responses.
 */
export const hotelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  imageUrl: z.string().nullable(),
  starRating: z.number().int().min(1).max(5).nullable(),
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
  roomType: z.string(),
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
 * - numberOfNights and totalPriceInCents are calculated server-side
 */
export const createHotelBookingInputSchema = z
  .object({
    hotelId: z.string().min(1),
    checkInDate: isoDateSchema,
    checkOutDate: isoDateSchema,
    roomType: z.string().trim().min(1).max(100),
    pricePerNightInCents: z.number().int().min(0),
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

/**
 * Input for updating a hotel booking.
 * When dates are updated, numberOfNights and totalPriceInCents are recalculated.
 */
export const updateHotelBookingInputSchema = z
  .object({
    checkInDate: isoDateSchema.optional(),
    checkOutDate: isoDateSchema.optional(),
    roomType: z.string().trim().min(1).max(100).optional(),
    pricePerNightInCents: z.number().int().min(0).optional(),
    status: z.enum(bookingStatusValues).optional(),
  })
  .refine(
    (value) => {
      // If both dates are provided, validate the range
      if (value.checkInDate && value.checkOutDate) {
        return (
          isValidDateRange(value.checkInDate, value.checkOutDate) &&
          value.checkInDate !== value.checkOutDate
        );
      }
      return true;
    },
    {
      message: "checkOutDate must be after checkInDate",
      path: ["checkOutDate"],
    },
  );

export type UpdateHotelBookingInput = z.infer<typeof updateHotelBookingInputSchema>;
