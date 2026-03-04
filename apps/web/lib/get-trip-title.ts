import type { TripWithDestinationDTO } from "@trip-loom/api/dto";

export function getTripTitle(trip: TripWithDestinationDTO): string {
  if (trip.title) {
    return trip.title;
  }

  if (trip.destination?.name && trip.destination?.country) {
    return `${trip.destination.name}, ${trip.destination.country}`;
  }

  if (trip.destination?.name) {
    return trip.destination.name;
  }

  return "Untitled Trip";
}
