import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from "@tanstack/react-query";
import type {
  CreateTripInput,
  PaginatedResponse,
  TripQuery,
  TripWithDestinationDTO,
  UpdateTripInput,
} from "@trip-loom/api/dto";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["trips"] as const,
  list: (query: Omit<TripQuery, "cursor">) =>
    [...KEYS.base(), "list", query] as const,
  detail: (tripId: string) => [...KEYS.base(), "detail", tripId] as const,
  create: () => [...KEYS.base(), "create"] as const,
  update: (tripId: string) => [...KEYS.base(), "update", tripId] as const,
  remove: (tripId: string) => [...KEYS.base(), "delete", tripId] as const,
};

export type UpdateTripVars = {
  tripId: string;
  body: UpdateTripInput;
};

export type DeleteTripVars = {
  tripId: string;
};

export const tripQueries = {
  base: () => KEYS.base(),
  listTrips: (query: TripQuery) => {
    // eslint-disable-next-line
    const { cursor: _cursor, ...queryWithoutCursor } = query;

    return infiniteQueryOptions({
      queryKey: KEYS.list(queryWithoutCursor),
      initialPageParam: query.cursor,
      getNextPageParam: (lastPage: PaginatedResponse<TripWithDestinationDTO>) =>
        lastPage.nextCursor ?? undefined,
      queryFn: async ({ pageParam, signal }) => {
        const result = await apiClient.api.trips.get({
          query: {
            ...query,
            cursor: pageParam,
          },
          fetch: { signal },
        });

        if (!result.data) {
          throw new Error("Could not load trips");
        }

        return result.data;
      },
    });
  },
  getTripById: (tripId: string) =>
    queryOptions({
      queryKey: KEYS.detail(tripId),
      queryFn: async ({ signal }) =>
        apiClient.api.trips({ id: tripId }).get({ fetch: { signal } }),
    }),
  createTrip: () =>
    mutationOptions({
      mutationKey: KEYS.create(),
      mutationFn: async (vars: CreateTripInput) =>
        apiClient.api.trips.post(vars),
    }),
  updateTrip: () =>
    mutationOptions({
      mutationKey: KEYS.update("any"),
      mutationFn: async (vars: UpdateTripVars) =>
        apiClient.api.trips({ id: vars.tripId }).patch(vars.body),
    }),
  deleteTrip: () =>
    mutationOptions({
      mutationKey: KEYS.remove("any"),
      mutationFn: async (vars: DeleteTripVars) =>
        apiClient.api.trips({ id: vars.tripId }).delete(),
    }),
};
