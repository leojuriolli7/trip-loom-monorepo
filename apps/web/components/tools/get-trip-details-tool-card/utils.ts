import type {
  ItineraryActivityDTO,
  TripDetailDTO,
} from "@trip-loom/contracts/dto";
import { format } from "date-fns";
import { parseIsoDate } from "@/lib/parse-iso-date";
import { formatPaymentAmount } from "@/utils/payments";

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "Pending";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDateValue(date: string | null | undefined) {
  if (!date) {
    return "Date pending";
  }

  const parsedDate = parseIsoDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return format(parsedDate, "MMM d, yyyy");
}

function formatDateTimeValue(date: Date | string | null | undefined) {
  if (!date) {
    return "Time pending";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return typeof date === "string" ? date : "Time pending";
  }

  return format(parsedDate, "EEE, MMM d • h:mm a");
}

export function getActivityTimeLabel(activity: ItineraryActivityDTO) {
  if (activity.startTime && activity.endTime) {
    return `${activity.startTime} - ${activity.endTime}`;
  }

  return activity.startTime ?? activity.endTime ?? null;
}

export function getTripImageUrl(trip: TripDetailDTO | null | undefined) {
  return (
    trip?.destination?.imagesUrls?.find((image) => image.isCover)?.url ??
    trip?.destination?.imagesUrls?.[0]?.url ??
    "/globe-glass.png"
  );
}

export function getTripDestinationLabel(trip: TripDetailDTO) {
  return trip.destination
    ? `${trip.destination.name}, ${trip.destination.country}`
    : "Destination pending";
}

export function formatItinerarySummary(trip: TripDetailDTO) {
  return trip.itinerary?.days.length
    ? "itinerary planned"
    : "no itinerary planned";
}

export function formatTripSummary(trip: TripDetailDTO, tripDates: string) {
  const planParts = [
    pluralize(trip.flightBookings.length, "flight"),
    pluralize(trip.hotelBookings.length, "hotel stay", "hotel stays"),
    formatItinerarySummary(trip),
  ];

  return `${getTripDestinationLabel(trip)}. ${tripDates}. ${planParts.join(", ")}.`;
}

export function formatFlightSchedule(
  departureTime: Date | string,
  arrivalTime: Date | string,
) {
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return `${formatDateTimeValue(departureTime)} to ${formatDateTimeValue(arrivalTime)}`;
  }

  const isSameDay =
    departure.getFullYear() === arrival.getFullYear() &&
    departure.getMonth() === arrival.getMonth() &&
    departure.getDate() === arrival.getDate();

  if (isSameDay) {
    return `${format(departure, "EEE, MMM d")} • ${format(
      departure,
      "h:mm a",
    )} to ${format(arrival, "h:mm a")}`;
  }

  return `${format(departure, "EEE, MMM d • h:mm a")} to ${format(
    arrival,
    "EEE, MMM d • h:mm a",
  )}`;
}

export function formatHotelStaySummary(
  booking: TripDetailDTO["hotelBookings"][number],
) {
  return `${formatDateValue(booking.checkInDate)} to ${formatDateValue(
    booking.checkOutDate,
  )} • ${pluralize(booking.numberOfNights, "night")} • ${formatPaymentAmount(
    booking.pricePerNightInCents,
    "usd",
  )}/night`;
}

export function formatPaymentTimestamp(date: Date | string) {
  return formatDateTimeValue(date);
}
