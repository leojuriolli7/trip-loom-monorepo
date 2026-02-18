import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type {
  DestinationDTO,
  DestinationQuery,
  PaginatedResponse,
} from "@trip-loom/api/dto";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["destinations"] as const,
  list: (query: Omit<DestinationQuery, "cursor">) =>
    [...KEYS.base(), "list", query] as const,
  detail: (id: string) => [...KEYS.base(), "detail", id] as const,
  fullDetail: (id: string) => [...KEYS.base(), "fullDetail", id] as const,
  recommended: (limit: number) =>
    [...KEYS.base(), "recommended", limit] as const,
};

export const destinationQueries = {
  base: () => KEYS.base(),
  listDestinations: (query: DestinationQuery) => {
    // eslint-disable-next-line
    const { cursor: _cursor, ...queryWithoutCursor } = query;

    return infiniteQueryOptions({
      // TODO: eventually write a shared util/helper that writes most of the options here for us,
      // like select, initialPageparam, getNextPageParam etc... but without loosing on typesafety.
      select(data) {
        return data?.pages.flatMap((page) => page.data) || [];
      },
      queryKey: KEYS.list(queryWithoutCursor),
      initialPageParam: query.cursor,
      getNextPageParam: (lastPage: PaginatedResponse<DestinationDTO>) =>
        lastPage.nextCursor ?? undefined,
      queryFn: async ({ pageParam, signal }) => {
        const result = await apiClient.api.destinations.get({
          query: {
            ...query,
            cursor: pageParam,
          },
          fetch: { signal },
        });

        if (!result.data) {
          throw new Error("Could not load destinations");
        }

        return result.data;
      },
    });
  },
  getDestinationById: (id: string) =>
    queryOptions({
      queryKey: KEYS.detail(id),
      queryFn: async ({ signal }) =>
        apiClient.api.destinations({ id }).get({ fetch: { signal } }),
    }),
  getDestinationDetail: (id: string) =>
    queryOptions({
      queryKey: KEYS.fullDetail(id),
      queryFn: async ({ signal }) => {
        const result = await apiClient.api
          .destinations({ id })
          .detail.get({ fetch: { signal } });

        if (!result.data) {
          throw new Error("Could not load destination details");
        }

        return result.data;
      },
    }),
  listRecommendedDestinations: (limit: number = 10) =>
    queryOptions({
      queryKey: KEYS.recommended(limit),
      queryFn: async ({ signal }) => {
        const result = await apiClient.api.destinations.recommended.get({
          query: { limit },
          fetch: { signal },
        });

        if (!result.data) {
          throw new Error("Could not load recommendations");
        }

        return result.data;
      },
    }),
};
