"use client";

import type { RequestCancellationToolResult } from "@trip-loom/contracts/dto";
import { Badge } from "@/components/ui/badge";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { usePaymentBooking } from "@/hooks/use-payment-booking";
import {
  formatPaymentResolvedAt,
  getPaymentBookingLabel,
} from "@/utils/payments";

type RequestCancellationToolResultCardProps = {
  tripId: string;
  result: RequestCancellationToolResult;
};

export function RequestCancellationToolResultCard({
  tripId,
  result,
}: RequestCancellationToolResultCardProps) {
  const { booking } = usePaymentBooking({
    tripId,
    bookingType: result.bookingType,
    bookingId: result.bookingId,
  });

  const bookingLabel = booking ? getPaymentBookingLabel(booking) : "booking";
  const resolvedAtLabel = formatPaymentResolvedAt(result.resolvedAt);

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/luggage.png" alt="Luggage" />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            {result.confirmed
              ? "Cancellation confirmed"
              : "Cancellation declined"}
          </ToolCallCard.Title>

          <ToolCallCard.Description className="first-letter:normal">
            {result.confirmed
              ? `${bookingLabel} cancellation was approved by the user.`
              : `${bookingLabel} cancellation was declined. The booking remains active.`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="flex flex-wrap items-center gap-2">
        <Badge variant={result.confirmed ? "destructive" : "outline"}>
          {result.confirmed ? "Cancelled" : "Kept"}
        </Badge>

        <Badge variant="outline" className="capitalize">
          {result.bookingType}
        </Badge>

        {resolvedAtLabel ? (
          <Badge variant="outline">{resolvedAtLabel}</Badge>
        ) : null}
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
