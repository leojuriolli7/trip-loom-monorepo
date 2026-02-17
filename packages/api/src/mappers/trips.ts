import {
  flightBooking,
  hotel,
  hotelBooking,
  itinerary,
  itineraryActivity,
  itineraryDay,
  payment,
  trip,
  destination,
} from "../db/schema";
import type { TripWithDestinationDTO } from "../dto/trips";

export const tripSelectFields = {
  id: trip.id,
  userId: trip.userId,
  destinationId: trip.destinationId,
  title: trip.title,
  status: trip.status,
  startDate: trip.startDate,
  endDate: trip.endDate,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
} as const;

export const tripDestinationSelectFields = {
  id: destination.id,
  name: destination.name,
  country: destination.country,
  countryCode: destination.countryCode,
  imageUrl: destination.imageUrl,
} as const;

type DestinationSummaryRow = {
  id: string | null;
  name: string | null;
  country: string | null;
  countryCode: string | null;
  imageUrl: string | null;
} | null;

export type TripWithDestinationRow = typeof trip.$inferSelect & {
  destination: DestinationSummaryRow;
};

const mapTripDestination = (
  value: DestinationSummaryRow,
): TripWithDestinationDTO["destination"] => {
  if (!value) {
    return null;
  }

  if (!value.id || !value.name || !value.country || !value.countryCode) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    country: value.country,
    countryCode: value.countryCode,
    imageUrl: value.imageUrl,
  };
};

export const mapTripWithDestination = (
  row: TripWithDestinationRow,
): TripWithDestinationDTO => ({
  ...row,
  destination: mapTripDestination(row.destination),
});

export const flightBookingSelectFields = {
  id: flightBooking.id,
  tripId: flightBooking.tripId,
  paymentId: flightBooking.paymentId,
  type: flightBooking.type,
  flightNumber: flightBooking.flightNumber,
  airline: flightBooking.airline,
  departureAirportCode: flightBooking.departureAirportCode,
  departureCity: flightBooking.departureCity,
  departureTime: flightBooking.departureTime,
  arrivalAirportCode: flightBooking.arrivalAirportCode,
  arrivalCity: flightBooking.arrivalCity,
  arrivalTime: flightBooking.arrivalTime,
  durationMinutes: flightBooking.durationMinutes,
  seatNumber: flightBooking.seatNumber,
  cabinClass: flightBooking.cabinClass,
  priceInCents: flightBooking.priceInCents,
  status: flightBooking.status,
  createdAt: flightBooking.createdAt,
  updatedAt: flightBooking.updatedAt,
} as const;

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

export const hotelSummarySelectFields = {
  id: hotel.id,
  name: hotel.name,
  address: hotel.address,
  imageUrl: hotel.imageUrl,
  starRating: hotel.starRating,
} as const;

export const paymentSelectFields = {
  id: payment.id,
  tripId: payment.tripId,
  stripePaymentIntentId: payment.stripePaymentIntentId,
  stripeCustomerId: payment.stripeCustomerId,
  amountInCents: payment.amountInCents,
  currency: payment.currency,
  status: payment.status,
  description: payment.description,
  refundedAmountInCents: payment.refundedAmountInCents,
  metadata: payment.metadata,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
} as const;

export const itinerarySelectFields = {
  id: itinerary.id,
  tripId: itinerary.tripId,
  createdAt: itinerary.createdAt,
  updatedAt: itinerary.updatedAt,
} as const;

export const itineraryDaySelectFields = {
  id: itineraryDay.id,
  itineraryId: itineraryDay.itineraryId,
  dayNumber: itineraryDay.dayNumber,
  date: itineraryDay.date,
  title: itineraryDay.title,
  notes: itineraryDay.notes,
  createdAt: itineraryDay.createdAt,
  updatedAt: itineraryDay.updatedAt,
} as const;

export const itineraryActivitySelectFields = {
  id: itineraryActivity.id,
  itineraryDayId: itineraryActivity.itineraryDayId,
  orderIndex: itineraryActivity.orderIndex,
  title: itineraryActivity.title,
  description: itineraryActivity.description,
  startTime: itineraryActivity.startTime,
  endTime: itineraryActivity.endTime,
  location: itineraryActivity.location,
  locationUrl: itineraryActivity.locationUrl,
  estimatedCostInCents: itineraryActivity.estimatedCostInCents,
  createdAt: itineraryActivity.createdAt,
  updatedAt: itineraryActivity.updatedAt,
} as const;
