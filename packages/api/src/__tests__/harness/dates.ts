/**
 * Formats a Date object to ISO date string (YYYY-MM-DD).
 */
export const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Returns an ISO date string (YYYY-MM-DD) offset from today by the given number of days.
 *
 * @param offsetDays - Number of days to offset (positive for future, negative for past)
 *
 * @example
 * ```ts
 * dateWithOffset(7)   // "2026-01-22" (if today is 2026-01-15)
 * dateWithOffset(-7)  // "2026-01-08"
 * dateWithOffset(0)   // "2026-01-15" (today)
 * ```
 */
export const dateWithOffset = (offsetDays: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatDate(date);
};
