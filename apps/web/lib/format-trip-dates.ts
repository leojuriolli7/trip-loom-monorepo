import { parseIsoDate } from "./parse-iso-date";
import { format } from "date-fns";

export function formatTripDates(
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) {
    return "Dates pending";
  }

  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}
