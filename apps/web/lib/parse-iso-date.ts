import { parse } from "date-fns";

/**
 * Takes in a ISO calendar date string and parses into a Date object.
 */
export function parseIsoDate(isoDate: string) {
  // date-only parse (no UTC shift)
  const date = parse(isoDate, "yyyy-MM-dd", new Date());

  return date;
}
