import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type {
  HotelDTO,
  HotelQuery,
  PaginatedResponse,
} from "@trip-loom/api/dto";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["hotels"] as const,
  list: (query: Omit<HotelQuery, "cursor">) =>
    [...KEYS.base(), "list", query] as const,
  detail: (id: string) => [...KEYS.base(), "detail", id] as const,
};

export const hotelQueries = {
  base: () => KEYS.base(),
  listHotels: (query: HotelQuery) => {
    // eslint-disable-next-line
    const { cursor: _cursor, ...queryWithoutCursor } = query;

    return infiniteQueryOptions({
      queryKey: KEYS.list(queryWithoutCursor),
      initialPageParam: query.cursor,
      getNextPageParam: (lastPage: PaginatedResponse<HotelDTO>) =>
        lastPage.nextCursor ?? undefined,
      queryFn: async ({ pageParam, signal }) => {
        const result = await apiClient.api.hotels.get({
          query: {
            ...query,
            cursor: pageParam,
          },
          fetch: { signal },
        });

        if (!result.data) {
          throw new Error("Could not load hotels");
        }

        return result.data;
      },
    });
  },
  getHotelById: (id: string) =>
    queryOptions({
      queryKey: KEYS.detail(id),
      queryFn: async ({ signal }) =>
        apiClient.api.hotels({ id }).get({ fetch: { signal } }),
    }),
};
