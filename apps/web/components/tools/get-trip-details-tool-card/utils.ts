import type {
  ItineraryActivityDTO,
  TripDetailDTO,
} from "@trip-loom/contracts/dto";
import { format, isSameDay } from "date-fns";
import { parseIsoDate } from "@/lib/parse-iso-date";
import { formatPaymentAmount } from "@/utils/payments";
import { pluralize } from "@/utils/pluralize";

// Converts enum-like backend values into readable UI labels.
export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "Pending";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

// Formats an ISO date string for compact trip detail displays.
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

// Formats date-time values while preserving a safe fallback for invalid inputs.
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

// Collapses optional itinerary start and end times into a single label.
export function getActivityTimeLabel(activity: ItineraryActivityDTO) {
  if (activity.startTime && activity.endTime) {
    return `${activity.startTime} - ${activity.endTime}`;
  }

  return activity.startTime ?? activity.endTime ?? null;
}

// Picks the best available trip image, falling back to the default artwork.
export function getTripImageUrl(trip: TripDetailDTO | null | undefined) {
  return (
    trip?.destination?.imagesUrls?.find((image) => image.isCover)?.url ??
    trip?.destination?.imagesUrls?.[0]?.url ??
    "/globe-glass.png"
  );
}

// Builds the destination label shown in the trip summary header.
export function getTripDestinationLabel(trip: TripDetailDTO) {
  return trip.destination
    ? `${trip.destination.name}, ${trip.destination.country}`
    : "Destination pending";
}

// Summarizes whether the trip already has an itinerary attached.
export function formatItinerarySummary(trip: TripDetailDTO) {
  return trip.itinerary?.days.length
    ? "itinerary planned"
    : "no itinerary planned";
}

// Combines destination, dates, and booking counts into the collapsed card summary.
export function formatTripSummary(trip: TripDetailDTO, tripDates: string) {
  const planParts = [
    pluralize(trip.flightBookings.length, "flight"),
    pluralize(trip.hotelBookings.length, "hotel stay", "hotel stays"),
    formatItinerarySummary(trip),
  ];

  return `${getTripDestinationLabel(trip)}. ${tripDates}. ${planParts.join(", ")}.`;
}

// Formats a flight schedule with a shorter same-day layout when possible.
export function formatFlightSchedule(
  departureTime: Date | string,
  arrivalTime: Date | string,
) {
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return `${formatDateTimeValue(departureTime)} to ${formatDateTimeValue(arrivalTime)}`;
  }

  const isSameDayDate = isSameDay(departure, arrival);

  if (isSameDayDate) {
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

// Summarizes hotel stay timing, length, and nightly rate on one line.
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

// Normalizes payment timestamps through the shared date-time formatter.
export function formatPaymentTimestamp(date: Date | string) {
  return formatDateTimeValue(date);
}
