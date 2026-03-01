import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { FlightSearchQuery } from "@trip-loom/api/dto";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["flights"],
  search: (query: FlightSearchQuery) => [...KEYS.base(), "search", query],
  listByTrip: (tripId: string) => [...KEYS.base(), "list-by-trip", tripId],
  detail: (tripId: string, flightId: string) => [
    ...KEYS.base(),
    "detail",
    tripId,
    flightId,
  ],
  create: (tripId: string) => [...KEYS.base(), "create", tripId],
  update: (tripId: string, flightId: string) => [
    ...KEYS.base(),
    "update",
    tripId,
    flightId,
  ],
  remove: (tripId: string, flightId: string) => [
    ...KEYS.base(),
    "delete",
    tripId,
    flightId,
  ],
};

type TripsCall = ReturnType<typeof apiClient.api.trips>;

type CreateFlightBookingVars = {
  tripId: string;
  body: Parameters<TripsCall["flights"]["post"]>[0];
};

type DeleteFlightBookingVars = {
  tripId: string;
  flightId: string;
};

export const flightQueries = {
  base: () => KEYS.base(),

  searchFlights: (query: FlightSearchQuery) =>
    queryOptions({
      queryKey: KEYS.search(query),
      queryFn: async ({ signal }) =>
        apiClient.api.flights.search.get({ query, fetch: { signal } }),
    }),

  listTripFlightBookings: (tripId: string) =>
    queryOptions({
      queryKey: KEYS.listByTrip(tripId),
      queryFn: async ({ signal }) =>
        apiClient.api.trips({ id: tripId }).flights.get({ fetch: { signal } }),
    }),

  getTripFlightBooking: (tripId: string, flightId: string) =>
    queryOptions({
      queryKey: KEYS.detail(tripId, flightId),
      queryFn: async ({ signal }) =>
        apiClient.api
          .trips({ id: tripId })
          .flights({ flightId })
          .get({ fetch: { signal } }),
    }),

  createTripFlightBooking: () =>
    mutationOptions({
      mutationKey: KEYS.create("any"),
      mutationFn: async (vars: CreateFlightBookingVars) =>
        apiClient.api.trips({ id: vars.tripId }).flights.post(vars.body),
    }),

  deleteTripFlightBooking: () =>
    mutationOptions({
      mutationKey: KEYS.remove("any", "any"),
      mutationFn: async (vars: DeleteFlightBookingVars) =>
        apiClient.api
          .trips({ id: vars.tripId })
          .flights({ flightId: vars.flightId })
          .delete(),
    }),
};
