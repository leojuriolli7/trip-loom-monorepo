import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["itineraries"],
  detailByTrip: (tripId: string) => [...KEYS.base(), "detail-by-trip", tripId],
  create: (tripId: string) => [...KEYS.base(), "create", tripId],
  remove: (tripId: string) => [...KEYS.base(), "delete", tripId],
};

type TripsCall = ReturnType<typeof apiClient.api.trips>;

type CreateItineraryVars = {
  tripId: string;
  body: Parameters<TripsCall["itinerary"]["post"]>[0];
};

type DeleteItineraryVars = {
  tripId: string;
};

export const itineraryQueries = {
  base: () => KEYS.base(),
  getTripItinerary: (tripId: string) =>
    queryOptions({
      queryKey: KEYS.detailByTrip(tripId),
      queryFn: async ({ signal }) =>
        apiClient.api
          .trips({ id: tripId })
          .itinerary.get({ fetch: { signal } }),
    }),
  createTripItinerary: () =>
    mutationOptions({
      mutationKey: KEYS.create("any"),
      mutationFn: async (vars: CreateItineraryVars) =>
        apiClient.api.trips({ id: vars.tripId }).itinerary.post(vars.body),
    }),
  deleteTripItinerary: () =>
    mutationOptions({
      mutationKey: KEYS.remove("any"),
      mutationFn: async (vars: DeleteItineraryVars) =>
        apiClient.api.trips({ id: vars.tripId }).itinerary.delete(),
    }),
};
