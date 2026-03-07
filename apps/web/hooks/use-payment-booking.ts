"use client";

import { useQuery } from "@tanstack/react-query";
import { flightQueries } from "@/lib/api/react-query/flights";
import { hotelBookingQueries } from "@/lib/api/react-query/hotel-bookings";
import type { PaymentBookingType } from "@trip-loom/contracts/dto/payments";

type UsePaymentBookingParams = {
  tripId: string;
  bookingType: PaymentBookingType;
  bookingId: string;
};

/**
 * Fetches the booking for a given payment.
 */
export function usePaymentBooking({
  tripId,
  bookingType,
  bookingId,
}: UsePaymentBookingParams) {
  const flightBookingQuery = useQuery({
    ...flightQueries.getTripFlightBooking(tripId, bookingId),
    enabled: bookingType === "flight",
  });

  const hotelBookingQuery = useQuery({
    ...hotelBookingQueries.getTripHotelBooking(tripId, bookingId),
    enabled: bookingType === "hotel",
  });

  if (bookingType === "flight") {
    return {
      booking: flightBookingQuery.data?.data
        ? ({
            bookingType: "flight",
            booking: flightBookingQuery.data.data,
          } as const)
        : null,
      isError: flightBookingQuery.isError,
      isPending: flightBookingQuery.isPending,
    };
  }

  return {
    booking: hotelBookingQuery.data?.data
      ? ({
          bookingType: "hotel",
          booking: hotelBookingQuery.data.data,
        } as const)
      : null,
    isError: hotelBookingQuery.isError,
    isPending: hotelBookingQuery.isPending,
  };
}
