import { flightBooking } from "../db/schema";

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
