export const isValidDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): boolean => {
  if (!startDate || !endDate) {
    return true;
  }

  return startDate <= endDate;
};

export const isDateTodayOrLater = (
  date: string | null | undefined,
): boolean => {
  if (!date) {
    return true;
  }

  const isoCalendarDate = new Date().toISOString().slice(0, 10);

  return date >= isoCalendarDate;
};
