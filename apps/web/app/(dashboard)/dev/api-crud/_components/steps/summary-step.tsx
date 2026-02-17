"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CheckCircle2Icon,
  PlaneIcon,
  HotelIcon,
  CalendarIcon,
  MapPinIcon,
  CreditCardIcon,
  StarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWizard } from "../wizard-context";

export function SummaryStep() {
  const {
    trip,
    destination,
    outboundFlight,
    outboundPayment,
    returnFlight,
    returnPayment,
    hotelBooking,
    hotelPayment,
    itinerary,
    reset,
  } = useWizard();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const totalSpent = React.useMemo(() => {
    let total = 0;
    if (outboundPayment?.status === "succeeded") {
      total += outboundPayment.amountInCents;
    }
    if (returnPayment?.status === "succeeded") {
      total += returnPayment.amountInCents;
    }
    if (hotelPayment?.status === "succeeded") {
      total += hotelPayment.amountInCents;
    }
    return total;
  }, [outboundPayment, returnPayment, hotelPayment]);

  const handleStartOver = () => {
    reset();
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2Icon className="size-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Trip Created Successfully!</CardTitle>
        <CardDescription>
          A summary of your trip to {destination?.name ?? "your destination"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Trip Overview */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPinIcon className="size-5 text-primary" />
              <h3 className="font-medium">Trip Details</h3>
            </div>
            <div className="grid gap-2 text-sm">
              {trip?.title && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium">{trip.title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium">
                  {destination?.name}, {destination?.country}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium">
                  {trip?.startDate && trip?.endDate
                    ? `${format(new Date(trip.startDate), "MMM d")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">{trip?.status}</Badge>
              </div>
            </div>
          </div>

          {/* Flights */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <PlaneIcon className="size-5 text-primary" />
              <h3 className="font-medium">Flights</h3>
            </div>
            <div className="space-y-3">
              {outboundFlight && (
                <div className="rounded-lg bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Outbound
                    </span>
                    <Badge
                      variant={
                        outboundPayment?.status === "succeeded"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {outboundPayment?.status ?? outboundFlight.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {outboundFlight.departureAirportCode} →{" "}
                        {outboundFlight.arrivalAirportCode}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {outboundFlight.flightNumber} • {outboundFlight.airline}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatPrice(outboundFlight.priceInCents)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {returnFlight && (
                <div className="rounded-lg bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Return
                    </span>
                    <Badge
                      variant={
                        returnPayment?.status === "succeeded"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {returnPayment?.status ?? returnFlight.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {returnFlight.departureAirportCode} →{" "}
                        {returnFlight.arrivalAirportCode}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {returnFlight.flightNumber} • {returnFlight.airline}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatPrice(returnFlight.priceInCents)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hotel */}
          {hotelBooking && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <HotelIcon className="size-5 text-primary" />
                <h3 className="font-medium">Hotel</h3>
              </div>
              <div className="rounded-lg bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {hotelBooking.hotel.name}
                    </span>
                    <div className="flex">
                      {Array.from({
                        length: hotelBooking.hotel.starRating,
                      }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className="size-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                  <Badge
                    variant={
                      hotelPayment?.status === "succeeded"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {hotelPayment?.status ?? hotelBooking.status}
                  </Badge>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-muted-foreground">
                    {hotelBooking.roomType} • {hotelBooking.numberOfNights}{" "}
                    nights
                  </div>
                  <div className="text-muted-foreground">
                    {format(new Date(hotelBooking.checkInDate), "MMM d")} -{" "}
                    {format(new Date(hotelBooking.checkOutDate), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="mt-2 text-right font-medium">
                  {formatPrice(hotelBooking.totalPriceInCents)}
                </div>
              </div>
            </div>
          )}

          {/* Itinerary */}
          {itinerary && itinerary.days.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="size-5 text-primary" />
                <h3 className="font-medium">Itinerary</h3>
              </div>
              <div className="space-y-2">
                {itinerary.days.map((day) => (
                  <div key={day.id} className="rounded-lg bg-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        Day {day.dayNumber}:{" "}
                        {day.title ?? format(new Date(day.date), "EEE, MMM d")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {day.activities.length} activities
                      </span>
                    </div>
                    {day.activities.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {day.activities.map((a) => a.title).join(" • ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="rounded-xl border border-primary bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCardIcon className="size-5 text-primary" />
              <h3 className="font-medium">Payment Summary</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Total Paid</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(totalSpent)}
              </span>
            </div>
          </div>

          {/* Debug Info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="font-medium mb-2">Debug: IDs</h3>
            <div className="grid gap-1 text-xs text-muted-foreground font-mono">
              <div>Trip: {trip?.id}</div>
              <div>Outbound Flight: {outboundFlight?.id}</div>
              <div>Return Flight: {returnFlight?.id}</div>
              <div>Hotel Booking: {hotelBooking?.id}</div>
              <div>Itinerary: {itinerary?.id}</div>
              <div>
                Payments:{" "}
                {[outboundPayment?.id, returnPayment?.id, hotelPayment?.id]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>
          </div>

          <Button
            onClick={handleStartOver}
            variant="outline"
            className="w-full"
          >
            Start Over (New Trip)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
