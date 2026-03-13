import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["google-maps"],
  placeDetails: (placeId: string) => [...KEYS.base(), "place-details", placeId],
};

export const googleMapsQueries = {
  base: () => KEYS.base(),
  getPlaceDetails: (placeId: string) =>
    queryOptions({
      queryKey: KEYS.placeDetails(placeId),
      queryFn: async ({ signal }) => {
        const result = await apiClient.api.maps
          .places({ placeId })
          .details.get({ fetch: { signal } });

        if (result.error || !result.data) {
          throw new Error(
            `Failed to load place details (${result.status ?? "unknown"})`,
          );
        }

        return result.data;
      },
    }),
};
