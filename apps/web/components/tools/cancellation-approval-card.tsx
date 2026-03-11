"use client";

import { useState } from "react";
import type { ToolApprovalInterrupt } from "@trip-loom/agents";
import { HotelBookingSummaryCard } from "@/components/tools/hotel-booking-summary-card";
import { usePaymentBooking } from "@/hooks/use-payment-booking";
import { getPaymentBookingLabel } from "@/lib/payments";
import { Spinner } from "@/components/ui/spinner";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatActionCard } from "./core/chat-action-card";

type CancellationApprovalCardProps = {
  interrupt: ToolApprovalInterrupt;
  disabled?: boolean;
  onApprove: () => void;
  onReject: (message?: string) => void;
};

function getBookingParams(interrupt: ToolApprovalInterrupt) {
  const args = interrupt.args;

  if (interrupt.toolName === "cancel_hotel_booking") {
    return {
      tripId: args.tripId as string,
      bookingType: "hotel" as const,
      bookingId: args.hotelBookingId as string,
    };
  }

  return {
    tripId: args.tripId as string,
    bookingType: "flight" as const,
    bookingId: args.flightBookingId as string,
  };
}

export function CancellationApprovalCard({
  interrupt,
  disabled,
  onApprove,
  onReject,
}: CancellationApprovalCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const params = getBookingParams(interrupt);
  const { booking, isError, isPending } = usePaymentBooking(params);

  const handleReject = () => {
    if (showFeedback) {
      onReject(feedback || undefined);
    } else {
      onReject();
    }
  };

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
        description="We could not load booking details, but you can still proceed"
        imageAlt="Luggage"
        imageSrc="/luggage.png"
        onCancel={handleReject}
        onConfirm={onApprove}
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
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                disabled={disabled}
                onClick={onApprove}
                size="sm"
                variant="destructive"
              >
                Confirm cancellation
              </Button>
              <Button
                disabled={disabled}
                onClick={
                  showFeedback ? handleReject : () => setShowFeedback(true)
                }
                size="sm"
                variant="outline"
              >
                Keep booking
              </Button>
            </div>

            {showFeedback && (
              <Textarea
                placeholder="Why do you want to keep it? (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
              />
            )}
          </div>
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
      onCancel={handleReject}
      onConfirm={onApprove}
      title="Cancel booking"
    />
  );
}
