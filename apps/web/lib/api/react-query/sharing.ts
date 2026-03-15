import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["sharing"],
  shareStatus: (tripId: string) => [...KEYS.base(), "status", tripId],
  sharedTrip: (shareToken: string) => [...KEYS.base(), "shared", shareToken],
  enableSharing: (tripId: string) => [...KEYS.base(), "enable", tripId],
  disableSharing: (tripId: string) => [...KEYS.base(), "disable", tripId],
};

type EnableSharingVars = {
  tripId: string;
};

type DisableSharingVars = {
  tripId: string;
};

export const sharingQueries = {
  base: () => KEYS.base(),
  shareStatusKey: (tripId: string) => KEYS.shareStatus(tripId),
  getShareStatus: (tripId: string) =>
    queryOptions({
      queryKey: KEYS.shareStatus(tripId),
      queryFn: async ({ signal }) =>
        apiClient.api.trips({ id: tripId }).share.get({ fetch: { signal } }),
    }),
  getSharedTrip: (shareToken: string) =>
    queryOptions({
      queryKey: KEYS.sharedTrip(shareToken),
      queryFn: async ({ signal }) =>
        apiClient.api.shared({ shareToken }).get({ fetch: { signal } }),
    }),
  enableSharing: () =>
    mutationOptions({
      mutationKey: KEYS.enableSharing("any"),
      mutationFn: async (vars: EnableSharingVars) =>
        apiClient.api.trips({ id: vars.tripId }).share.post(),
    }),
  disableSharing: () =>
    mutationOptions({
      mutationKey: KEYS.disableSharing("any"),
      mutationFn: async (vars: DisableSharingVars) =>
        apiClient.api.trips({ id: vars.tripId }).share.delete(),
    }),
};
