import type { QueryClient } from "@tanstack/react-query";
import { flightQueries } from "@/lib/api/react-query/flights";
import { hotelBookingQueries } from "@/lib/api/react-query/hotel-bookings";
import { paymentQueries } from "@/lib/api/react-query/payments";
import { tripQueries } from "@/lib/api/react-query/trips";
import type { PaymentBookingType } from "@/lib/payments";

export async function invalidatePaymentConversationQueries(
  queryClient: QueryClient,
  params: {
    tripId: string;
    bookingType: PaymentBookingType;
    bookingId: string;
    paymentId?: string;
  },
) {
  const invalidations = [
    queryClient.invalidateQueries({
      queryKey: tripQueries.getTripById(params.tripId).queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: [...tripQueries.base(), "list"],
    }),
  ];

  if (params.bookingType === "flight") {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: flightQueries.getTripFlightBooking(
          params.tripId,
          params.bookingId,
        ).queryKey,
      }),
    );
  } else {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: hotelBookingQueries.getTripHotelBooking(
          params.tripId,
          params.bookingId,
        ).queryKey,
      }),
    );
  }

  if (params.paymentId) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: paymentQueries.getPaymentById(params.paymentId).queryKey,
      }),
    );
  }

  await Promise.all(invalidations);
}
