import type {
  FlightBookingPaymentOutcomeDTO,
  HotelBookingPaymentOutcomeDTO,
} from "@trip-loom/contracts/dto";
import { Badge } from "@/components/ui/badge";
import { ToolCallCard } from "./tool-call-card";

type BookingPaymentResult =
  | FlightBookingPaymentOutcomeDTO
  | HotelBookingPaymentOutcomeDTO;

type BookingPaymentResultCardProps = {
  result: BookingPaymentResult;
};

export function BookingPaymentResultCard({
  result,
}: BookingPaymentResultCardProps) {
  const title =
    result.bookingType === "hotel"
      ? result.status === "paid"
        ? `Your stay at ${result.booking.hotel.name} is confirmed`
        : `Checkout cancelled for ${result.booking.hotel.name}`
      : result.status === "paid"
        ? `Your flight ${result.booking.flightNumber} is confirmed`
        : `Checkout cancelled for flight ${result.booking.flightNumber}`;

  const description =
    result.status === "paid"
      ? "Payment completed successfully and TripLoom saved the booking."
      : "No payment was completed. You can try again whenever you are ready.";

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/wallet.png" alt="Wallet" />
        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>{title}</ToolCallCard.Title>
          <ToolCallCard.Description className="first-letter:normal">
            {description}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="flex flex-wrap items-center gap-2">
        <Badge variant={result.status === "paid" ? "secondary" : "outline"}>
          {result.status === "paid" ? "Confirmed" : "Cancelled"}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {result.bookingType}
        </Badge>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
