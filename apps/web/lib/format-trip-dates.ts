import type { TripWithDestinationDTO } from "@trip-loom/contracts/dto";
import { parseIsoDate } from "./parse-iso-date";
import { format } from "date-fns";

export function formatTripDates(trip: TripWithDestinationDTO): string {
  if (!trip.startDate || !trip.endDate) {
    return "Dates pending";
  }

  const startDate = parseIsoDate(trip.startDate);
  const endDate = parseIsoDate(trip.endDate);

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}
