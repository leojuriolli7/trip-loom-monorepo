import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["hotel-bookings"],
  listByTrip: (tripId: string) => [...KEYS.base(), "list-by-trip", tripId],
  detail: (tripId: string, hotelBookingId: string) => [
    ...KEYS.base(),
    "detail",
    tripId,
    hotelBookingId,
  ],
  create: (tripId: string) => [...KEYS.base(), "create", tripId],
  update: (tripId: string, hotelBookingId: string) => [
    ...KEYS.base(),
    "update",
    tripId,
    hotelBookingId,
  ],
  remove: (tripId: string, hotelBookingId: string) => [
    ...KEYS.base(),
    "delete",
    tripId,
    hotelBookingId,
  ],
};

type TripsCall = ReturnType<typeof apiClient.api.trips>;

type CreateHotelBookingVars = {
  tripId: string;
  body: Parameters<TripsCall["hotels"]["post"]>[0];
};

type UpdateHotelBookingVars = {
  tripId: string;
  hotelBookingId: string;
  body: Parameters<ReturnType<TripsCall["hotels"]>["patch"]>[0];
};

type DeleteHotelBookingVars = {
  tripId: string;
  hotelBookingId: string;
};

export const hotelBookingQueries = {
  base: () => KEYS.base(),
  listTripHotelBookings: (tripId: string) =>
    queryOptions({
      queryKey: KEYS.listByTrip(tripId),
      queryFn: async ({ signal }) =>
        apiClient.api.trips({ id: tripId }).hotels.get({ fetch: { signal } }),
    }),
  getTripHotelBooking: (tripId: string, hotelBookingId: string) =>
    queryOptions({
      queryKey: KEYS.detail(tripId, hotelBookingId),
      queryFn: async ({ signal }) =>
        apiClient.api
          .trips({ id: tripId })
          .hotels({ hotelBookingId })
          .get({ fetch: { signal } }),
    }),
  createTripHotelBooking: () =>
    mutationOptions({
      mutationKey: KEYS.create("any"),
      mutationFn: async (vars: CreateHotelBookingVars) =>
        apiClient.api.trips({ id: vars.tripId }).hotels.post(vars.body),
    }),
  updateTripHotelBooking: () =>
    mutationOptions({
      mutationKey: KEYS.update("any", "any"),
      mutationFn: async (vars: UpdateHotelBookingVars) =>
        apiClient.api
          .trips({ id: vars.tripId })
          .hotels({ hotelBookingId: vars.hotelBookingId })
          .patch(vars.body),
    }),
  deleteTripHotelBooking: () =>
    mutationOptions({
      mutationKey: KEYS.remove("any", "any"),
      mutationFn: async (vars: DeleteHotelBookingVars) =>
        apiClient.api
          .trips({ id: vars.tripId })
          .hotels({ hotelBookingId: vars.hotelBookingId })
          .delete(),
    }),
};
