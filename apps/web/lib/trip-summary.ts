import type { TripDetailDTO } from "@trip-loom/contracts/dto";
import { pluralize } from "@/lib/pluralize";

export function getTripActivityCount(trip: TripDetailDTO) {
  return (
    trip.itinerary?.days.reduce(
      (activityCount, day) => activityCount + day.activities.length,
      0,
    ) ?? 0
  );
}

export function getTripDestinationLabel(trip: TripDetailDTO) {
  return trip.destination
    ? `${trip.destination.name}, ${trip.destination.country}`
    : "Destination pending";
}

function formatItinerarySummary(trip: TripDetailDTO) {
  if (!trip.itinerary?.days.length) {
    return "no itinerary planned";
  }

  return `${pluralize(
    getTripActivityCount(trip),
    "activity",
    "activities",
  )} planned`;
}

export function formatTripSummary(trip: TripDetailDTO, tripDates: string) {
  const planParts = [
    pluralize(trip.flightBookings.length, "flight"),
    pluralize(trip.hotelBookings.length, "hotel stay", "hotel stays"),
    formatItinerarySummary(trip),
  ];

  return `${getTripDestinationLabel(trip)}. ${tripDates}. ${planParts.join(", ")}`;
}
