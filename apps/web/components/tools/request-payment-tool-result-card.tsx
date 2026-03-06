"use client";

import { useQuery } from "@tanstack/react-query";
import type { RequestPaymentToolResult } from "@trip-loom/contracts/dto";
import { Badge } from "@/components/ui/badge";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { usePaymentBooking } from "@/hooks/use-payment-booking";
import { paymentQueries } from "@/lib/api/react-query/payments";
import {
  formatPaymentAmount,
  formatPaymentResolvedAt,
  getPaymentBookingAmount,
  getPaymentBookingLabel,
} from "@/utils/payments";

type RequestPaymentToolResultCardProps = {
  tripId: string;
  result: RequestPaymentToolResult;
};

export function RequestPaymentToolResultCard({
  tripId,
  result,
}: RequestPaymentToolResultCardProps) {
  const { booking } = usePaymentBooking({
    tripId,
    bookingType: result.bookingType,
    bookingId: result.bookingId,
  });

  const paymentId = result.status === "paid" ? result.paymentId : "";

  const paymentQuery = useQuery({
    ...paymentQueries.getPaymentById(paymentId),
    enabled: result.status === "paid",
  });

  const bookingLabel = booking ? getPaymentBookingLabel(booking) : "booking";

  const amountLabel =
    result.status === "paid" && paymentQuery.data?.data
      ? formatPaymentAmount(
          paymentQuery.data.data.amountInCents,
          paymentQuery.data.data.currency,
        )
      : booking
        ? formatPaymentAmount(getPaymentBookingAmount(booking), "usd")
        : null;

  const resolvedAtLabel = formatPaymentResolvedAt(result.resolvedAt);

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/wallet.png" alt="Wallet" />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            {result.status === "paid"
              ? "Payment received"
              : "Payment cancelled"}
          </ToolCallCard.Title>

          <ToolCallCard.Description className="first-letter:normal">
            {result.status === "paid"
              ? `Payment for ${bookingLabel} was completed successfully.`
              : `Checkout for ${bookingLabel} was closed without payment.`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="flex flex-wrap items-center gap-2">
        <Badge variant={result.status === "paid" ? "secondary" : "outline"}>
          {result.status === "paid" ? "Paid" : "Cancelled"}
        </Badge>

        <Badge variant="outline" className="capitalize">
          {result.bookingType}
        </Badge>

        {amountLabel ? <Badge variant="outline">{amountLabel}</Badge> : null}

        {resolvedAtLabel ? (
          <Badge variant="outline">{resolvedAtLabel}</Badge>
        ) : null}
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
