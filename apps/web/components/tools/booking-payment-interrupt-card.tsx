"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { BookingPaymentInterrupt } from "@trip-loom/agents";
import { PaymentFormWithProvider } from "@/components/payment-form";
import { paymentQueries } from "@/lib/api/react-query/payments";
import { invalidatePaymentConversationQueries } from "@/lib/invalidate-payment-queries";
import { poll } from "@/lib/poll";
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
    await poll({
      createPromise: async () =>
        queryClient.fetchQuery({
          ...paymentQueries.getPaymentById(interrupt.paymentSession.id),
          gcTime: 0,
          staleTime: 0,
        }),
      onSuccess: (result) => result.data?.status !== "succeeded",
      interval: 1500,
      maxAttempts: 20,
    });

    await invalidatePaymentConversationQueries(queryClient, {
      tripId,
      bookingId: interrupt.booking.id,
      bookingType: interrupt.bookingType,
      paymentId: interrupt.paymentSession.id,
    });

    onPaid();
  }

  const paymentForm = interrupt.paymentSession.clientSecret ? (
    <PaymentFormWithProvider
      amountInCents={interrupt.paymentSession.amountInCents}
      clientSecret={interrupt.paymentSession.clientSecret}
      currency={interrupt.paymentSession.currency}
      disabled={disabled}
      onCancel={onCancel}
      onSuccess={() => {
        void handlePaid();
      }}
    />
  ) : null;

  if (interrupt.bookingType === "hotel") {
    return (
      <HotelBookingSummaryCard
        booking={interrupt.booking}
        statusLabel="Payment required"
        title={interrupt.booking.hotel.name}
        summary="Complete payment to confirm this stay"
      >
        {paymentForm}
      </HotelBookingSummaryCard>
    );
  }

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
