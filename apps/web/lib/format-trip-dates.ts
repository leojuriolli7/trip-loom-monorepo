import { parseIsoDate } from "./parse-iso-date";
import { format, isValid } from "date-fns";

export function formatTripDates(
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) {
    return "Dates pending";
  }

  if (!isValid(parseIsoDate(start)) || !isValid(parseIsoDate(end))) {
    return "";
  }

  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}
