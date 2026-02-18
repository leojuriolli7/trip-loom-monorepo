"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  type FlightBookingDTO,
  type FlightOptionDTO,
  type FlightSeat,
} from "@trip-loom/api/dto";
import { cabinClassValues } from "@trip-loom/api/enums";
import { PlaneIcon, ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AirplaneSeatView } from "@/components/tools-ui/airplane-seat-view";
import { flightQueries } from "@/lib/api/react-query/flights";
import { useWizard } from "../wizard-context";

const CABIN_CLASS_LABELS: Record<
  (typeof cabinClassValues)[number],
  string
> = {
  economy: "Economy",
  business: "Business",
  first: "First Class",
};

type BookFlightStepProps = {
  flightType: "outbound" | "return";
};

type Step = "search" | "select-seat";

export function BookFlightStep({ flightType }: BookFlightStepProps) {
  const { trip, destination, setOutboundFlight, setReturnFlight, nextStep } =
    useWizard();

  const isOutbound = flightType === "outbound";

  // For outbound: departure date = trip start date
  // For return: departure date = trip end date
  // Format as yyyy-MM-dd for the search API
  const flightDate = React.useMemo(() => {
    const date = isOutbound ? trip?.startDate : trip?.endDate;
    if (!date) return null;
    // Handle both Date objects and ISO strings - extract just the date part
    return format(new Date(date), "yyyy-MM-dd");
  }, [isOutbound, trip?.startDate, trip?.endDate]);

  // Default airports
  const defaultFrom = isOutbound
    ? "JFK"
    : destination?.countryCode === "JP"
      ? "NRT"
      : "LHR";
  const defaultTo = isOutbound
    ? destination?.countryCode === "JP"
      ? "NRT"
      : "LHR"
    : "JFK";

  const [currentStep, setCurrentStep] = React.useState<Step>("search");
  const [searchParams, setSearchParams] = React.useState({
    from: defaultFrom,
    to: defaultTo,
    cabinClass: "economy" as (typeof cabinClassValues)[number],
  });
  const [selectedFlight, setSelectedFlight] =
    React.useState<FlightOptionDTO | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Search flights query
  const searchQuery = useQuery({
    ...flightQueries.searchFlights({
      from: searchParams.from,
      to: searchParams.to,
      date: flightDate ?? format(new Date(), "yyyy-MM-dd"),
      cabinClass: searchParams.cabinClass,
      passengers: 1,
    }),
    enabled: hasSearched && !!flightDate,
  });

  const createFlightMutation = useMutation(
    flightQueries.createTripFlightBooking(),
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setSelectedFlight(null);
    setCurrentStep("search");
  };

  const handleSelectFlight = (flight: FlightOptionDTO) => {
    setSelectedFlight(flight);
    setCurrentStep("select-seat");
  };

  const handleBook = async (selectedSeat: FlightSeat) => {
    if (selectedSeat.isBooked) {
      toast.error("Selected seat is already booked");
      return;
    }

    if (!trip || !selectedFlight) {
      toast.error("Please select a flight and seat");
      return;
    }

    createFlightMutation
      .mutateAsync({
        tripId: trip.id,
        body: {
          type: isOutbound ? "outbound" : "inbound",
          flightNumber: selectedFlight.flightNumber,
          airline: selectedFlight.airline,
          departureAirportCode: selectedFlight.departureAirportCode,
          departureCity: selectedFlight.departureCity,
          departureTime: selectedFlight.departureTime,
          arrivalAirportCode: selectedFlight.arrivalAirportCode,
          arrivalCity: selectedFlight.arrivalCity,
          arrivalTime: selectedFlight.arrivalTime,
          durationMinutes: selectedFlight.durationMinutes,
          cabinClass: selectedFlight.cabinClass,
          priceInCents: selectedFlight.priceInCents + selectedSeat.priceInCents,
          seatNumber: selectedSeat.id,
        },
      })
      .then((result) => {
        if (result.error || !result.data) {
          toast.error("Failed to book flight");
          return;
        }

        const flight = result.data as FlightBookingDTO;
        if (isOutbound) {
          setOutboundFlight(flight);
        } else {
          setReturnFlight(flight);
        }

        toast.success(`${isOutbound ? "Outbound" : "Return"} flight booked!`);
        nextStep();
      })
      .catch(() => {
        toast.error("Failed to book flight");
      });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!trip) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No trip found. Please create a trip first.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book {isOutbound ? "Outbound" : "Return"} Flight</CardTitle>
        <CardDescription>
          {isOutbound
            ? `Flight to ${destination?.name ?? "destination"} on ${flightDate ? format(new Date(flightDate), "PPP") : "your trip start date"}`
            : `Return flight from ${destination?.name ?? "destination"} on ${flightDate ? format(new Date(flightDate), "PPP") : "your trip end date"}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="from-airport">From</FieldLabel>
                <Input
                  id="from-airport"
                  value={searchParams.from}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      from: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="JFK"
                  maxLength={4}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="to-airport">To</FieldLabel>
                <Input
                  id="to-airport"
                  value={searchParams.to}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      to: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="LHR"
                  maxLength={4}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cabin-class">Cabin Class</FieldLabel>
                <Select
                  value={searchParams.cabinClass}
                  onValueChange={(value) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      cabinClass: value as (typeof cabinClassValues)[number],
                    }))
                  }
                >
                  <SelectTrigger id="cabin-class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cabinClassValues.map((cabin) => (
                      <SelectItem key={cabin} value={cabin}>
                        {CABIN_CLASS_LABELS[cabin]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="text-sm text-muted-foreground">
              Flight date:{" "}
              {flightDate ? format(new Date(flightDate), "PPP") : "Not set"}
            </div>

            {currentStep === "search" && (
              <Button type="submit" disabled={searchQuery.isFetching}>
                {searchQuery.isFetching ? (
                  <>
                    <Spinner />
                    Searching...
                  </>
                ) : (
                  "Search Flights"
                )}
              </Button>
            )}
          </FieldGroup>
        </form>

        {/* Search Results */}
        {hasSearched && currentStep === "search" && (
          <div className="space-y-4">
            {searchQuery.isLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-8" />
              </div>
            )}

            {searchQuery.isError && (
              <div className="py-8 text-center text-destructive">
                Failed to search flights. Please try again.
              </div>
            )}

            {searchQuery.isSuccess && (
              <>
                {searchQuery.data.error ? (
                  <div className="py-8 text-center text-destructive">
                    {String(searchQuery.data.error.value)}
                  </div>
                ) : searchQuery.data.data &&
                  searchQuery.data.data.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {searchQuery.data.data.length} flight
                      {searchQuery.data.data.length !== 1 ? "s" : ""} found
                    </h3>
                    {searchQuery.data.data.map((flight) => (
                      <button
                        key={flight.id}
                        type="button"
                        onClick={() => handleSelectFlight(flight)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                          selectedFlight?.id === flight.id
                            ? "border-primary bg-primary/5"
                            : "border-border",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <PlaneIcon className="size-4 text-primary" />
                              <span className="font-medium">
                                {flight.flightNumber}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {flight.airline}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <div className="font-medium">
                                  {format(
                                    new Date(flight.departureTime),
                                    "HH:mm",
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  {flight.departureAirportCode}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <ClockIcon className="size-3" />
                                {formatDuration(flight.durationMinutes)}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {format(
                                    new Date(flight.arrivalTime),
                                    "HH:mm",
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  {flight.arrivalAirportCode}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatPrice(flight.priceInCents)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {flight.availableSeats} seat
                              {flight.availableSeats !== 1 ? "s" : ""} left
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No flights found for this route and date.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Seat Selection */}
        {currentStep === "select-seat" && selectedFlight && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AirplaneSeatView
                key={selectedFlight.id}
                title="Select Your Seat"
                flight={selectedFlight}
                onConfirm={(seatId) => {
                  if (createFlightMutation.isPending) {
                    return;
                  }

                  const seat = selectedFlight.seatMap
                    .flatMap((row) => row.sections.flat())
                    .find((rowSeat) => rowSeat.id === seatId);

                  if (!seat) {
                    toast.error("Unable to find selected seat");
                    return;
                  }

                  void handleBook(seat);
                }}
                onCancel={() => setCurrentStep("search")}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
