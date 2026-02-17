import { hotel, hotelBooking } from "../db/schema";

/**
 * Select fields for hotel booking queries.
 */
export const hotelBookingSelectFields = {
  id: hotelBooking.id,
  tripId: hotelBooking.tripId,
  hotelId: hotelBooking.hotelId,
  paymentId: hotelBooking.paymentId,
  checkInDate: hotelBooking.checkInDate,
  checkOutDate: hotelBooking.checkOutDate,
  roomType: hotelBooking.roomType,
  numberOfNights: hotelBooking.numberOfNights,
  pricePerNightInCents: hotelBooking.pricePerNightInCents,
  totalPriceInCents: hotelBooking.totalPriceInCents,
  status: hotelBooking.status,
  createdAt: hotelBooking.createdAt,
  updatedAt: hotelBooking.updatedAt,
} as const;

/**
 * Select fields for hotel summary (embedded in booking responses).
 * Used with Drizzle's .select() method.
 */
export const hotelSummarySelectFields = {
  id: hotel.id,
  name: hotel.name,
  address: hotel.address,
  imageUrl: hotel.imageUrl,
  starRating: hotel.starRating,
} as const;

/**
 * Column selection for hotel summary in relational queries.
 * Used with Drizzle's .findFirst()/.findMany() with { with: { hotel: { columns } } }.
 */
export const hotelSummaryColumns = {
  id: true,
  name: true,
  address: true,
  imageUrl: true,
  starRating: true,
} as const;
