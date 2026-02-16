import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["user-preferences"],
  get: () => [...KEYS.base(), "get-user-preferences"],
  put: () => [...KEYS.base(), "put-user-preferences"],
};

export const userPreferencesQueries = {
  base: () => KEYS.base(),
  getUserPreferences: () =>
    queryOptions({
      queryKey: KEYS.get(),
      queryFn: async ({ signal }) =>
        apiClient.api.user.preferences.get({ fetch: { signal } }),
    }),
  putUserPreferences: () =>
    mutationOptions({
      mutationFn: async (
        vars: Parameters<typeof apiClient.api.user.preferences.put>[0],
      ) => apiClient.api.user.preferences.put(vars),
      mutationKey: KEYS.put(),
    }),
};
