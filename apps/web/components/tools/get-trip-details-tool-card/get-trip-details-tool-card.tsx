"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { useQuery } from "@tanstack/react-query";
import {
  BedDoubleIcon,
  ChevronDownIcon,
  ClockIcon,
  DollarSignIcon,
  PlaneIcon,
} from "lucide-react";
import { useState } from "react";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { TripFeatureBadge } from "@/components/trip-feature-badge";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { tripQueries } from "@/lib/api/react-query/trips";
import { formatTripDates } from "@/lib/format-trip-dates";
import { cn } from "@/lib/utils";
import { formatPaymentAmount } from "@/utils/payments";
import { BookingStatusBadge } from "./booking-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge";
import { SectionHeading } from "./section-heading";
import { pluralize } from "@/utils/pluralize";
import {
  formatEnumLabel,
  formatFlightSchedule,
  formatHotelStaySummary,
  formatPaymentTimestamp,
  formatTripSummary,
  getTripImageUrl,
} from "./utils";
import {
  createSavedItinerarySheetData,
  itinerarySheetAtom,
} from "@/components/itinerary-sheet";
import { Button } from "@/components/ui/button";
import { useSetAtom } from "jotai";

type GetTripDetailsToolCardProps = {
  args: TripLoomToolArgsByName<"get_trip_details">;
};

export function GetTripDetailsToolCard({ args }: GetTripDetailsToolCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const setItinerarySheetAtom = useSetAtom(itinerarySheetAtom);

  const {
    data: tripResult,
    isError,
    isPending,
  } = useQuery({
    ...tripQueries.getTripById(args.tripId),
    enabled: Boolean(args.tripId),
    staleTime: 0,
  });

  if (isPending) {
    return null;
  }

  if (isError || tripResult?.error || !tripResult?.data) {
    return (
      <ToolCallCard>
        <ToolCallCard.Header>
          <ToolCallCard.Image
            src="/globe-glass.png"
            alt="Trip plans unavailable"
            className="rounded-2xl object-cover"
          />

          <ToolCallCard.HeaderContent className="pt-0.5">
            <ToolCallCard.Title>
              Looked up current trip plans
            </ToolCallCard.Title>
            <ToolCallCard.Description className="first-letter:normal">
              Could not load the latest trip snapshot.
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>
      </ToolCallCard>
    );
  }

  const trip = tripResult.data;
  const tripDates = formatTripDates(trip);
  const hasItinerary = Boolean(trip.itinerary?.days.length);
  const hasExpandedSections = Boolean(
    trip.flightBookings.length ||
      trip.hotelBookings.length ||
      trip.payments.length ||
      trip.itinerary?.days.length,
  );

  return (
    <ToolCallCard
      size="lg"
      className="bg-linear-to-br from-card via-card to-primary/5"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <ToolCallCard.Header className="justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <ToolCallCard.Image
              src={getTripImageUrl(trip)}
              alt={trip.destination?.name ?? "Trip plans"}
              className="rounded-2xl object-cover"
            />

            <ToolCallCard.HeaderContent className="min-w-0 space-y-3 pt-0.5">
              <div className="space-y-1">
                <ToolCallCard.Title>
                  Looked up current trip plans
                </ToolCallCard.Title>
                <ToolCallCard.Description className="first-letter:normal">
                  {formatTripSummary(trip, tripDates)}
                </ToolCallCard.Description>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TripStatusBadge status={trip.status} />

                {trip.hasFlights ? (
                  <TripFeatureBadge variant="flights" />
                ) : null}

                {trip.hasHotel ? <TripFeatureBadge variant="hotel" /> : null}

                {trip.hasItinerary ? (
                  <TripFeatureBadge variant="itinerary" />
                ) : null}

                {!trip.hasFlights && !trip.hasHotel && !trip.hasItinerary ? (
                  <Badge variant="outline">Planning in progress</Badge>
                ) : null}
              </div>
            </ToolCallCard.HeaderContent>
          </div>

          <CollapsibleTrigger
            className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
            aria-label={isOpen ? "Hide trip details" : "Show trip details"}
          >
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                !isOpen && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        </ToolCallCard.Header>

        <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
          <div className="mt-4 space-y-4">
            {hasExpandedSections ? (
              <div className="overflow-hidden rounded-3xl bg-linear-to-b from-card to-secondary/10">
                <div className="divide-y divide-border/60">
                  {trip.flightBookings.length > 0 ? (
                    <section className="space-y-3 p-4 sm:p-5">
                      <SectionHeading
                        icon={PlaneIcon}
                        title="Flights"
                        description={`${pluralize(
                          trip.flightBookings.length,
                          "flight",
                        )} currently linked to this trip`}
                      />

                      <div className="space-y-2.5">
                        {trip.flightBookings.map((flight) => (
                          <article
                            key={flight.id}
                            className="rounded-2xl px-3.5 py-3"
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
                                {formatPaymentAmount(
                                  flight.priceInCents,
                                  "usd",
                                )}
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
                                {formatEnumLabel(flight.cabinClass)}
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
                    <section className="space-y-3 p-4 sm:p-5">
                      <SectionHeading
                        icon={BedDoubleIcon}
                        title="Hotel stays"
                        description={`${pluralize(
                          trip.hotelBookings.length,
                          "hotel stay",
                          "hotel stays",
                        )} currently linked to this trip`}
                      />

                      <div className="space-y-2.5">
                        {trip.hotelBookings.map((booking) => (
                          <article
                            key={booking.id}
                            className="rounded-2xl px-3.5 py-3"
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
                                {formatEnumLabel(booking.roomType)}
                              </Badge>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {hasItinerary ? (
                    <section className="space-y-3 p-4 sm:p-5">
                      <SectionHeading
                        icon={ClockIcon}
                        title="Itinerary"
                        description="The day-by-day plan is in place"
                      />

                      <Button
                        variant="outline"
                        onClick={() => {
                          if (trip.itinerary) {
                            setItinerarySheetAtom({
                              isOpen: true,
                              itinerary: createSavedItinerarySheetData(
                                trip.itinerary,
                              ),
                            });
                          }
                        }}
                        size="sm"
                      >
                        Click to see the full trip itinerary
                      </Button>
                    </section>
                  ) : null}

                  {trip.payments.length > 0 ? (
                    <section className="space-y-3 p-4 sm:p-5">
                      <SectionHeading
                        icon={DollarSignIcon}
                        title="Payments"
                        description={`${pluralize(
                          trip.payments.length,
                          "payment",
                        )} tracked for this trip`}
                      />

                      <div className="overflow-hidden rounded-2xl">
                        <div className="divide-y divide-border/50">
                          {trip.payments.map((payment) => (
                            <article
                              key={payment.id}
                              className="flex flex-wrap items-start justify-between gap-3 px-3.5 py-3"
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
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </ToolCallCard>
  );
}
