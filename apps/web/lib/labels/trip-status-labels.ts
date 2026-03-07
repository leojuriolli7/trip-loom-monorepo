import type { TripStatus } from "@trip-loom/contracts";

export const tripStatusLabels: Record<TripStatus, string> = {
  cancelled: "Cancelled",
  current: "Ongoing",
  draft: "Draft",
  past: "Finalized",
  upcoming: "Upcoming",
};
