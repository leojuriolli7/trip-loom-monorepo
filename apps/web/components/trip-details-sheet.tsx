"use client";

import type { TripDetailDTO } from "@trip-loom/contracts/dto";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom, useSetAtom } from "jotai";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { TripFeatureBadge } from "@/components/trip-feature-badge";
import { TripStatusBadge } from "@/components/trip-status-badge";
import {
  createSavedItinerarySheetData,
  itinerarySheetAtom,
} from "@/components/itinerary-sheet";
import { tripQueries } from "@/lib/api/react-query/trips";
import { formatTripDates } from "@/lib/format-trip-dates";
import { getTripTitle } from "@/lib/get-trip-title";
import { formatFlightSchedule } from "@/lib/format-flight-schedule";
import { formatHotelStaySummary } from "@/lib/format-hotel-stay-summary";
import { formatTripSummary } from "@/lib/trip-summary";
import { getCoverImage } from "@/lib/get-cover-image";
import { cabinClassLabels } from "@/lib/labels/cabin-class-labels";
import { hotelRoomTypeLabels } from "@/lib/labels/hotel-room-type-labels";
import { formatPaymentAmount, formatPaymentTimestamp } from "@/lib/payments";
import { pluralize } from "@/lib/pluralize";
import { ArrowRightIcon } from "lucide-react";
import { useCallback } from "react";

type TripDetailsSheetAtomValue = {
  tripId: string | null;
  isOpen: boolean;
};

export const tripDetailsSheetAtom = atom<TripDetailsSheetAtomValue>({
  tripId: null,
  isOpen: false,
});

export function useOpenTripDetailsSheet() {
  const setTripDetailsSheet = useSetAtom(tripDetailsSheetAtom);

  return useCallback(
    (tripId: string) => {
      setTripDetailsSheet({
        tripId,
        isOpen: true,
      });
    },
    [setTripDetailsSheet],
  );
}

function TripDetailsSectionHeading({
  iconSrc,
  iconAlt,
  title,
  description,
}: {
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative mt-0.5 shrink-0">
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={96}
          height={96}
          className="h-20 w-20 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]"
        />
      </div>
      <div className="space-y-1 pt-3">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TripDetailsSheetBody({ trip }: { trip: TripDetailDTO }) {
  const setItinerarySheet = useSetAtom(itinerarySheetAtom);
  const tripDates = formatTripDates(trip?.startDate, trip?.endDate);
  const hasExpandedSections = Boolean(
    trip.flightBookings.length ||
      trip.hotelBookings.length ||
      trip.payments.length,
  );

  return (
    <>
      <SheetHeader className="gap-5 border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative aspect-5/4 w-full overflow-hidden rounded-3xl border border-border/60 bg-secondary/20 sm:w-56">
            <Image
              src={getCoverImage(
                trip?.destination?.imagesUrls,
                "/globe-glass.png",
              )}
              alt={trip.destination?.name ?? "Trip details"}
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/5 to-transparent" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <SheetTitle className="text-left text-2xl font-semibold tracking-tight">
                {getTripTitle(trip)}
              </SheetTitle>
              <SheetDescription className="text-left leading-relaxed">
                {formatTripSummary(trip, tripDates)}
              </SheetDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TripStatusBadge status={trip.status} />

              {trip.hasFlights ? <TripFeatureBadge variant="flights" /> : null}
              {trip.hasHotel ? <TripFeatureBadge variant="hotel" /> : null}
              {trip.hasItinerary ? (
                <TripFeatureBadge variant="itinerary" />
              ) : null}

              {!trip.hasFlights && !trip.hasHotel && !trip.hasItinerary ? (
                <Badge variant="outline">Planning in progress</Badge>
              ) : null}
            </div>

            {!!trip?.itinerary ? (
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  if (trip.itinerary) {
                    setItinerarySheet({
                      isOpen: true,
                      itinerary: createSavedItinerarySheetData(trip.itinerary),
                    });
                  }
                }}
              >
                {`See ${pluralize(trip.itinerary.days.length, "day")} Itinerary`}

                <ArrowRightIcon />
              </Button>
            ) : null}
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto bg-linear-to-b from-background via-background to-secondary/20 px-4 py-5 sm:px-6 sm:py-6 [&::-webkit-scrollbar]:hidden">
        {!hasExpandedSections ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-card/70 px-5 py-6 text-sm text-muted-foreground">
            No bookings or payments are linked to this trip yet.
          </div>
        ) : (
          <div className="space-y-4">
            {trip.flightBookings.length > 0 ? (
              <section className="rounded-3xl p-5 sm:p-6">
                <TripDetailsSectionHeading
                  iconSrc="/plane.png"
                  iconAlt="3D airplane icon"
                  title="Flights"
                  description={`${pluralize(
                    trip.flightBookings.length,
                    "flight",
                  )} currently linked to this trip`}
                />

                <div className="mt-4 space-y-2.5">
                  {trip.flightBookings.map((flight) => (
                    <article
                      key={flight.id}
                      className="rounded-2xl bg-background/70 px-3.5 py-3 border border-border/60 bg-card/95 "
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold tracking-tight text-foreground">
                            {flight.airline} {flight.flightNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {flight.departureAirportCode} to{" "}
                            {flight.arrivalAirportCode}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-foreground">
                          {formatPaymentAmount(flight.priceInCents, "usd")}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatFlightSchedule(
                          flight.departureTime,
                          flight.arrivalTime,
                        )}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <BookingStatusBadge status={flight.status} />
                        <Badge variant="outline">
                          {cabinClassLabels[flight.cabinClass]}
                        </Badge>
                        <Badge variant="outline">
                          {flight.seatNumber ?? "Seat not selected"}
                        </Badge>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {trip.hotelBookings.length > 0 ? (
              <section className="rounded-3xl p-5 sm:p-6">
                <TripDetailsSectionHeading
                  iconSrc="/hotel-bell.png"
                  iconAlt="3D hotel bell icon"
                  title="Hotel Stays"
                  description={`${pluralize(
                    trip.hotelBookings.length,
                    "hotel stay",
                    "hotel stays",
                  )} currently linked to this trip`}
                />

                <div className="mt-4 space-y-2.5">
                  {trip.hotelBookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-2xl bg-background/70 px-3.5 py-3 border border-border/60 bg-card/95 "
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold tracking-tight text-foreground">
                            {booking.hotel.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {booking.hotel.address}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-foreground">
                          {formatPaymentAmount(
                            booking.totalPriceInCents,
                            "usd",
                          )}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatHotelStaySummary(booking)}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <BookingStatusBadge status={booking.status} />
                        <Badge variant="outline">
                          {hotelRoomTypeLabels[booking.roomType]}
                        </Badge>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {trip.payments.length > 0 ? (
              <section className="rounded-3xl p-5 sm:p-6">
                <TripDetailsSectionHeading
                  iconSrc="/wallet.png"
                  iconAlt="3D wallet icon"
                  title="Payments"
                  description={`${pluralize(
                    trip.payments.length,
                    "payment",
                  )} tracked for this trip`}
                />

                <div className="mt-4 space-y-2.5">
                  {trip.payments.map((payment) => (
                    <article
                      key={payment.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-background/70 px-3.5 py-3 border border-border/60 bg-card/95 "
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-tight text-foreground">
                          {payment.description ?? "Trip payment"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPaymentTimestamp(payment.createdAt)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PaymentStatusBadge status={payment.status} />
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-foreground">
                        {formatPaymentAmount(
                          payment.amountInCents,
                          payment.currency,
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

export function TripDetailsSheet() {
  const [{ tripId, isOpen }, setTripDetailsSheet] =
    useAtom(tripDetailsSheetAtom);

  const {
    data: tripResult,
    isError,
    isPending,
  } = useQuery({
    ...tripQueries.getTripById(tripId ?? ""),
    enabled: Boolean(tripId && isOpen),
    staleTime: 0,
  });

  function onOpenChange(nextOpen: boolean) {
    setTripDetailsSheet((prev) => ({
      ...prev,
      isOpen: nextOpen,
    }));
  }

  if (!tripId) {
    return null;
  }

  const trip = tripResult?.data ?? null;
  const didFail = isError || tripResult?.error || !trip;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 max-w-none! data-[side=right]:w-[min(96vw,1320px)] data-[side=right]:md:w-[82vw] data-[side=right]:xl:w-[70vw]"
      >
        {isPending ? (
          <div className="flex flex-1 items-center justify-center gap-3">
            <Spinner className="size-5" />
            <p className="text-sm text-muted-foreground">
              Loading current trip details...
            </p>
          </div>
        ) : null}

        {!isPending && didFail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Trip details unavailable
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              We could not load the latest trip snapshot right now.
            </p>
          </div>
        ) : null}

        {!isPending && trip ? <TripDetailsSheetBody trip={trip} /> : null}
      </SheetContent>
    </Sheet>
  );
}
