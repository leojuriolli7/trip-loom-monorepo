import { parseIsoDate } from "@/lib/parse-iso-date";
import type { ItinerarySheetActivity } from "../types";
import { format } from "date-fns";

export function formatItineraryDateLabel(date: string | null | undefined) {
  if (!date) {
    return "Date pending";
  }

  const parsedDate = parseIsoDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return format(parsedDate, "EEEE, MMM d");
}

export function getActivityTimeLabel(activity: ItinerarySheetActivity) {
  if (activity.startTime && activity.endTime) {
    return `${activity.startTime} - ${activity.endTime}`;
  }

  return activity.startTime ?? activity.endTime ?? null;
}

export function getActivitySourceLabel(activity: ItinerarySheetActivity) {
  if (activity.sourceName) {
    return activity.sourceName;
  }

  if (!activity.sourceUrl) {
    return null;
  }

  try {
    return new URL(activity.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}
