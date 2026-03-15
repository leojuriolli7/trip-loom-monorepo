import type { Metadata } from "next";
import { SharedPageNavbar } from "./_components/shared-page-navbar";
import { SharedTripHeader } from "./_components/shared-trip-header";
import { SharedFlightCard } from "./_components/shared-flight-card";
import { SharedHotelCard } from "./_components/shared-hotel-card";
import { SharedItinerarySection } from "./_components/shared-itinerary-section";
import { SharedTripNotFound } from "./_components/shared-trip-not-found";
import { PlaneIcon, BedDoubleIcon } from "lucide-react";
import { apiClient } from "@/lib/api/api-client";
import Link from "next/link";

type PageParams = {
  params: Promise<{ shareToken: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { shareToken } = await params;
  const { data: trip } = await apiClient.api.shared({ shareToken }).get();

  if (!trip) {
    return {
      title: "Trip not found | TripLoom",
    };
  }

  const title = trip.title ?? "Shared Trip";
  const destination = trip.destination
    ? `${trip.destination.name}, ${trip.destination.country}`
    : null;

  return {
    title: `${title} | TripLoom`,
    description: destination
      ? `Check out this trip to ${destination} on TripLoom`
      : `Check out this trip on TripLoom`,
  };
}

export default async function SharedTripPage({ params }: PageParams) {
  const { shareToken } = await params;
  const { data: trip } = await apiClient.api.shared({ shareToken }).get();

  if (!trip) {
    return <SharedTripNotFound />;
  }

  const hasFlights = trip.flightBookings.length > 0;
  const hasHotels = trip.hotelBookings.length > 0;
  const hasItinerary = trip.itinerary !== null;

  return (
    <div className="min-h-screen bg-background" data-testid="shared-trip-page">
      <SharedPageNavbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="space-y-8">
          <SharedTripHeader trip={trip} />

          {hasFlights && (
            <section data-testid="shared-flights-section">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
                  <PlaneIcon className="size-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Flights
                </h2>
              </div>

              <div className="space-y-3">
                {trip.flightBookings.map((flight) => (
                  <SharedFlightCard key={flight.id} flight={flight} />
                ))}
              </div>
            </section>
          )}

          {hasHotels && (
            <section data-testid="shared-hotels-section">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
                  <BedDoubleIcon className="size-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Hotels</h2>
              </div>

              <div className="space-y-3">
                {trip.hotelBookings.map((booking) => (
                  <SharedHotelCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}

          {hasItinerary && trip.itinerary && (
            <SharedItinerarySection itinerary={trip.itinerary} />
          )}

          {!hasFlights && !hasHotels && !hasItinerary && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card py-12 text-center">
              <p className="text-muted-foreground">
                This trip is still being planned
              </p>
              <p className="text-sm text-muted-foreground/70">
                Check back later for bookings and itinerary details
              </p>
            </div>
          )}
        </div>

        <footer className="mt-12 border-t border-border/40 pt-6 pb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Planned with{" "}
            <Link
              href="/"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              TripLoom
            </Link>{" "}
            — your AI travel companion
          </p>
        </footer>
      </main>
    </div>
  );
}
