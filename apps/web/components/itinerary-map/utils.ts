import type { ItineraryMapPlace } from "./types";

/**
 * Takes an array of places from our itinerary activities and generates a Google Maps
 * directions URL.
 */
export const createRouteUrlFromPlaces = (places: ItineraryMapPlace[]) => {
  const toLocationString = (place: ItineraryMapPlace) => {
    return place.displayName || place.address || `${place.lat},${place.lng}`;
  };

  const origin = places[0];
  const destination = places[places.length - 1];
  const stops = places.slice(1, -1);

  const params = new URLSearchParams({
    api: "1",
    origin: toLocationString(origin),
    destination: toLocationString(destination),
    travelmode: "walking",
  });

  if (origin.placeId) {
    params.set("origin_place_id", origin.placeId);
  }

  if (destination.placeId) {
    params.set("destination_place_id", destination.placeId);
  }

  if (stops.length > 0) {
    params.set("waypoints", stops.map(toLocationString).join("|"));

    // Only include waypoint_place_ids if every waypoint has a placeId,
    // because it must align 1:1 with waypoints in the same order.
    if (stops.every((place) => !!place.placeId)) {
      params.set(
        "waypoint_place_ids",
        stops.map((place) => place.placeId).join("|"),
      );
    }
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
