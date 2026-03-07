import { format, isSameDay } from "date-fns";

function formatDateTimeValue(date: Date | string | null | undefined) {
  if (!date) {
    return "Time pending";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return typeof date === "string" ? date : "Time pending";
  }

  return format(parsedDate, "EEE, MMM d • h:mm a");
}

export function formatFlightSchedule(
  departureTime: Date | string,
  arrivalTime: Date | string,
) {
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return `${formatDateTimeValue(departureTime)} to ${formatDateTimeValue(arrivalTime)}`;
  }

  if (isSameDay(departure, arrival)) {
    return `${format(departure, "EEE, MMM d")} • ${format(
      departure,
      "h:mm a",
    )} to ${format(arrival, "h:mm a")}`;
  }

  return `${format(departure, "EEE, MMM d • h:mm a")} to ${format(
    arrival,
    "EEE, MMM d • h:mm a",
  )}`;
}
