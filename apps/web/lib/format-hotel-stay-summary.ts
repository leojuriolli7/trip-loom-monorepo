import type { TripDetailDTO } from "@trip-loom/contracts/dto";
import { formatDateValue } from "@/lib/format-date-value";
import { formatPaymentAmount } from "@/lib/payments";
import { pluralize } from "@/lib/pluralize";

export function formatHotelStaySummary(
  booking: TripDetailDTO["hotelBookings"][number],
) {
  return `${formatDateValue(booking.checkInDate)} to ${formatDateValue(
    booking.checkOutDate,
  )} • ${pluralize(booking.numberOfNights, "night")} • ${formatPaymentAmount(
    booking.pricePerNightInCents,
    "usd",
  )}/night`;
}
