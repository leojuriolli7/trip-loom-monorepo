"use client";

import { HotelBookingSummaryCard } from "@/components/tools/hotel-booking-summary-card";
import { usePaymentBooking } from "@/hooks/use-payment-booking";
import { getPaymentBookingLabel } from "@/utils/payments";
import { Spinner } from "@/components/ui/spinner";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Button } from "@/components/ui/button";
import { ChatActionCard } from "./core/chat-action-card";
import type { PaymentBookingType } from "@/utils/payments";

type CancellationRequestCardProps = {
  tripId: string;
  bookingType: PaymentBookingType;
  bookingId: string;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CancellationRequestCard({
  tripId,
  bookingType,
  bookingId,
  disabled,
  onConfirm,
  onCancel,
}: CancellationRequestCardProps) {
  const { booking, isError, isPending } = usePaymentBooking({
    tripId,
    bookingType,
    bookingId,
  });

  if (isPending) {
    return (
      <ToolCallCard className="border-transparent shadow-none">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/luggage.png" alt="Luggage" />
          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>Cancel booking</ToolCallCard.Title>
            <ToolCallCard.Description>
              Loading booking details...
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>
        <ToolCallCard.Content>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading...
          </div>
        </ToolCallCard.Content>
      </ToolCallCard>
    );
  }

  if (isError || !booking) {
    return (
      <ChatActionCard
        cancelDisabled={disabled}
        confirmDisabled={disabled}
        confirmLabel="Confirm cancellation"
        cancelLabel="Keep booking"
        description="We could not load booking details, but you can still proceed."
        imageAlt="Luggage"
        imageSrc="/luggage.png"
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Cancel booking"
      />
    );
  }

  const bookingLabel = getPaymentBookingLabel(booking);

  if (booking.bookingType === "hotel") {
    return (
      <HotelBookingSummaryCard
        booking={booking.booking}
        statusLabel="Cancellation requested"
        summary={`Are you sure you want to cancel your reservation at ${bookingLabel}?`}
        title="Cancel hotel booking"
        footer={
          <>
            <Button
              disabled={disabled}
              onClick={onConfirm}
              size="sm"
              variant="destructive"
            >
              Confirm cancellation
            </Button>
            <Button
              disabled={disabled}
              onClick={onCancel}
              size="sm"
              variant="outline"
            >
              Keep booking
            </Button>
          </>
        }
      />
    );
  }

  return (
    <ChatActionCard
      cancelDisabled={disabled}
      confirmDisabled={disabled}
      confirmLabel="Confirm cancellation"
      cancelLabel="Keep booking"
      description={`Are you sure you want to cancel ${bookingLabel}?`}
      imageAlt="Luggage"
      imageSrc="/luggage.png"
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Cancel booking"
    />
  );
}
