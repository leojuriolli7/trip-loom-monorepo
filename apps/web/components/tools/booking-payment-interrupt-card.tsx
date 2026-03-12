"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { BookingPaymentInterrupt } from "@trip-loom/agents";
import { PaymentForm } from "@/components/payment-form";
import { invalidatePaymentConversationQueries } from "@/lib/invalidate-payment-queries";
import { FlightBookingSummaryCard } from "./flight-booking-summary-card";
import { HotelBookingSummaryCard } from "./hotel-booking-summary-card";

type BookingPaymentInterruptCardProps = {
  interrupt: BookingPaymentInterrupt;
  tripId: string;
  disabled?: boolean;
  onPaid: () => void;
  onCancel: () => void;
};

export function BookingPaymentInterruptCard({
  interrupt,
  tripId,
  disabled,
  onPaid,
  onCancel,
}: BookingPaymentInterruptCardProps) {
  const queryClient = useQueryClient();

  async function handlePaid() {
    await invalidatePaymentConversationQueries(queryClient, {
      tripId,
      bookingId: interrupt.booking.id,
      bookingType: interrupt.bookingType,
      paymentId: interrupt.paymentSession.id,
    });

    onPaid();
  }

  if (interrupt.bookingType === "hotel") {
    return (
      <HotelBookingSummaryCard
        booking={interrupt.booking}
        statusLabel="Payment required"
        title={interrupt.booking.hotel.name}
        summary="Complete payment to confirm this stay"
      >
        {interrupt.paymentSession.clientSecret ? (
          <PaymentForm
            amountInCents={interrupt.paymentSession.amountInCents}
            clientSecret={interrupt.paymentSession.clientSecret}
            currency={interrupt.paymentSession.currency}
            disabled={disabled}
            onCancel={onCancel}
            onSuccess={handlePaid}
            paymentId={interrupt.paymentSession.id}
          />
        ) : null}
      </HotelBookingSummaryCard>
    );
  }

  const paymentForm = interrupt.paymentSession.clientSecret ? (
    <PaymentForm
      amountInCents={interrupt.paymentSession.amountInCents}
      clientSecret={interrupt.paymentSession.clientSecret}
      currency={interrupt.paymentSession.currency}
      disabled={disabled}
      onCancel={onCancel}
      onSuccess={handlePaid}
      paymentId={interrupt.paymentSession.id}
    />
  ) : null;

  return (
    <FlightBookingSummaryCard
      booking={interrupt.booking}
      statusLabel="Payment required"
      title={"Completing your booking"}
      summary="Complete payment to confirm this flight"
    >
      {paymentForm}
    </FlightBookingSummaryCard>
  );
}
