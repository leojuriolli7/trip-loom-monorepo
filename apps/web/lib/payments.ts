import { format } from "date-fns";
import type {
  FlightBookingDetailDTO,
  HotelBookingDTO,
} from "@trip-loom/contracts/dto";

type PaymentBookingData =
  | {
      bookingType: "flight";
      booking: FlightBookingDetailDTO;
    }
  | {
      bookingType: "hotel";
      booking: HotelBookingDTO;
    };

function getFlightTypeLabel(type: FlightBookingDetailDTO["type"]) {
  return type === "outbound" ? "Outbound" : "Return";
}

export function getPaymentBookingAmount(booking: PaymentBookingData) {
  return booking.bookingType === "flight"
    ? booking.booking.priceInCents
    : booking.booking.totalPriceInCents;
}

export function getPaymentIntentDescription(booking: PaymentBookingData) {
  if (booking.bookingType === "flight") {
    return `${getFlightTypeLabel(booking.booking.type)} flight: ${booking.booking.flightNumber}`;
  }

  return `Hotel: ${booking.booking.hotel.name} (${booking.booking.numberOfNights} nights)`;
}

export function getPaymentBookingLabel(booking: PaymentBookingData) {
  if (booking.bookingType === "flight") {
    return `${getFlightTypeLabel(booking.booking.type)} flight ${booking.booking.flightNumber}`;
  }

  return booking.booking.hotel.name;
}

export function getPaymentBookingSummary(booking: PaymentBookingData) {
  if (booking.bookingType === "flight") {
    return `${getFlightTypeLabel(booking.booking.type)} flight from ${booking.booking.departureAirportCode} to ${booking.booking.arrivalAirportCode}`;
  }

  return `${booking.booking.hotel.name} for ${booking.booking.numberOfNights} night${booking.booking.numberOfNights === 1 ? "" : "s"}`;
}

export function formatPaymentAmount(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export function formatPaymentTimestamp(date: Date | string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return typeof date === "string" ? date : "Time pending";
  }

  return format(parsedDate, "EEE, MMM d • h:mm a");
}

export function formatPaymentResolvedAt(resolvedAt: string) {
  const date = new Date(resolvedAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, "PPP 'at' p");
}
