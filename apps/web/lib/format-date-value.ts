import { format } from "date-fns";
import { parseIsoDate } from "@/lib/parse-iso-date";

export function formatDateValue(date: string | null | undefined) {
  if (!date) {
    return "Date pending";
  }

  const parsedDate = parseIsoDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return format(parsedDate, "MMM d, yyyy");
}
