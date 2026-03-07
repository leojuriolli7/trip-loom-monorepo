import type { HotelBookingDTO } from "@trip-loom/contracts/dto";
import { formatPaymentAmount } from "@/lib/payments";
import { HotelBookingSummaryCard } from "./hotel-booking-summary-card";

type CreateHotelBookingToolResultCardProps = {
  booking: HotelBookingDTO;
};

/**
 * `create_hotel_booking` persists the complete booking payload, so history can
 * render an authoritative pending-booking card without trusting tool-call args.
 */
export function CreateHotelBookingToolResultCard({
  booking,
}: CreateHotelBookingToolResultCardProps) {
  return (
    <HotelBookingSummaryCard
      booking={booking}
      statusLabel="Pending booking"
      title="Placed a pending reservation"
      summary={`Your stay is reserved and ready for payment. Total due: ${formatPaymentAmount(booking.totalPriceInCents, "usd")}.`}
    />
  );
}
