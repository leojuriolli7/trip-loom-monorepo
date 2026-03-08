import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["suggestions"],
  forTrip: (tripId: string, lastMessageId: string) => [
    ...KEYS.base(),
    tripId,
    lastMessageId,
  ],
};

export const suggestionQueries = {
  base: () => KEYS.base(),
  getSuggestions: (tripId: string, lastMessageId: string) =>
    queryOptions({
      queryKey: KEYS.forTrip(tripId, lastMessageId),
      queryFn: async ({ signal }) => {
        const result = await apiClient.api
          .trips({ id: tripId })
          .suggestions.get({ fetch: { signal } });

        if (!result.data) {
          throw new Error("Could not load suggestions");
        }

        return result.data;
      },
    }),
};
