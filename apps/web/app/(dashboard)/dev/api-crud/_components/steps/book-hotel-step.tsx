"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import type { HotelDTO, HotelBookingDTO } from "@trip-loom/api/dto";
import { StarIcon } from "lucide-react";

import { apiClient } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hotelBookingQueries } from "@/lib/api/react-query/hotel-bookings";
import { useWizard } from "../wizard-context";
import { InfiniteSearchList } from "../infinite-search-list";

export function BookHotelStep() {
  const { trip, destination, setHotelBooking, nextStep } = useWizard();

  const [selectedHotel, setSelectedHotel] = React.useState<HotelDTO | null>(
    null,
  );
  const [roomType, setRoomType] = React.useState("Standard Room");
  const [pricePerNight, setPricePerNight] = React.useState(15000); // $150/night

  const createHotelBookingMutation = useMutation(
    hotelBookingQueries.createTripHotelBooking(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trip || !selectedHotel) {
      toast.error("Missing trip or hotel selection");
      return;
    }

    if (!trip.startDate || !trip.endDate) {
      toast.error("Trip dates are required");
      return;
    }

    createHotelBookingMutation
      .mutateAsync({
        tripId: trip.id,
        body: {
          hotelId: selectedHotel.id,
          checkInDate: format(new Date(trip.startDate), "yyyy-MM-dd"),
          checkOutDate: format(new Date(trip.endDate), "yyyy-MM-dd"),
          roomType,
          pricePerNightInCents: pricePerNight,
        },
      })
      .then((result) => {
        if (result.error || !result.data) {
          toast.error("Failed to book hotel");
          return;
        }

        const booking = result.data as HotelBookingDTO;
        setHotelBooking(booking);
        toast.success("Hotel booked!");
        nextStep();
      })
      .catch(() => {
        toast.error("Failed to book hotel");
      });
  };

  if (!trip || !destination) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Missing trip or destination data.
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Hotel</CardTitle>
        <CardDescription>
          Find and book accommodation in {destination.name} for{" "}
          {trip.startDate && trip.endDate
            ? `${format(new Date(trip.startDate), "MMM d")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}`
            : "your trip dates"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Select Hotel</FieldLabel>
              <FieldDescription>
                Search hotels in {destination.name}
              </FieldDescription>
              <InfiniteSearchList<HotelDTO>
                queryKey={["hotels-search", destination.id]}
                queryFn={async ({ search, pageParam }) => {
                  const result = await apiClient.api.hotels.get({
                    query: {
                      destinationId: destination.id,
                      search: search || undefined,
                      cursor: pageParam,
                      limit: 10,
                    },
                  });

                  if (!result.data) {
                    throw new Error("Failed to fetch hotels");
                  }

                  return result.data;
                }}
                renderItem={(hotel) => (
                  <div className="flex items-start gap-3">
                    {hotel.imageUrl && (
                      <img
                        src={hotel.imageUrl}
                        alt={hotel.name}
                        className="size-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {hotel.name}
                        </span>
                        <div className="flex shrink-0">
                          {Array.from({ length: hotel.starRating }).map(
                            (_, i) => (
                              <StarIcon
                                key={i}
                                className="size-3 fill-yellow-400 text-yellow-400"
                              />
                            ),
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {hotel.address}
                      </div>
                      <div className="text-xs font-medium text-primary">
                        {formatPrice(hotel.avgPricePerNightInCents)}/night
                      </div>
                    </div>
                  </div>
                )}
                getItemId={(h) => h.id}
                selectedId={selectedHotel?.id ?? null}
                onSelect={(hotel) => {
                  setSelectedHotel(hotel);
                  setPricePerNight(hotel.avgPricePerNightInCents);
                }}
                placeholder="Search hotels..."
                emptyMessage="No hotels found in this destination"
              />
            </Field>

            {selectedHotel && (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-4">
                    {selectedHotel.imageUrl && (
                      <img
                        src={selectedHotel.imageUrl}
                        alt={selectedHotel.name}
                        className="size-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{selectedHotel.name}</h4>
                        <div className="flex">
                          {Array.from({ length: selectedHotel.starRating }).map(
                            (_, i) => (
                              <StarIcon
                                key={i}
                                className="size-3 fill-yellow-400 text-yellow-400"
                              />
                            ),
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedHotel.address}
                      </p>
                      {selectedHotel.amenities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedHotel.amenities
                            .slice(0, 5)
                            .map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              >
                                {amenity}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="room-type">Room Type</FieldLabel>
                    <Input
                      id="room-type"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      placeholder="e.g., Standard Room"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="price-per-night">
                      Price per Night (cents)
                    </FieldLabel>
                    <Input
                      id="price-per-night"
                      type="number"
                      value={pricePerNight}
                      onChange={(e) =>
                        setPricePerNight(parseInt(e.target.value, 10))
                      }
                      min={0}
                      required
                    />
                  </Field>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in</span>
                      <span className="font-medium">
                        {trip.startDate
                          ? format(new Date(trip.startDate), "PPP")
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out</span>
                      <span className="font-medium">
                        {trip.endDate
                          ? format(new Date(trip.endDate), "PPP")
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedHotel || createHotelBookingMutation.isPending}
            >
              {createHotelBookingMutation.isPending ? (
                <>
                  <Spinner />
                  Booking Hotel...
                </>
              ) : (
                "Book Hotel"
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
