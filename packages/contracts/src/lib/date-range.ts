export const isValidDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): boolean => {
  if (!startDate || !endDate) {
    return true;
  }

  return startDate <= endDate;
};
