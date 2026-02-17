import { z } from "zod";
import { bookingStatusEnum } from "../db/schema";

const isoDateSchema = z.string().date();

export const hotelBookingStatusValues = bookingStatusEnum.enumValues;

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
  status: z.enum(hotelBookingStatusValues),
  createdAt: z.date(),
  updatedAt: z.date(),
  hotel: z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    imageUrl: z.string().nullable(),
    starRating: z.number().int().min(1).max(5),
  }),
});

export type HotelBookingDTO = z.infer<typeof hotelBookingSchema>;
