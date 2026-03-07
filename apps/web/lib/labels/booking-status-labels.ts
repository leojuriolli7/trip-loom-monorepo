import type { BookingStatus } from "@trip-loom/contracts";

export const bookingStatusLabels: Record<BookingStatus, string> = {
  cancelled: "Cancelled",
  confirmed: "Confirmed",
  pending: "Pending",
};
