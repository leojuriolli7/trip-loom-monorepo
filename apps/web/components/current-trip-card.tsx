import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import { TripFeatureBadge } from "./trip-feature-badge";
import { Button } from "./ui/button";
import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { getCoverImage } from "@/lib/get-cover-image";

export function CurrentTripCard({ trip }: { trip: TripWithDestinationDTO }) {
  const tripTitle = trip?.title ?? trip?.destination?.name ?? "Current trip";

  const tripDestinationLabel = trip?.destination
    ? `${trip.destination.name}, ${trip.destination.country}`
    : "Destination being finalized";

  const tripMessage =
    trip?.hasFlights || trip?.hasItinerary
      ? "Need to change your itinerary or book your return flight?"
      : "Ready to book flights, hotel, or map out your plans?";

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-sm">
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="grid gap-3 p-3 sm:grid-cols-[130px_1fr] sm:items-center sm:gap-4">
          <div className="relative overflow-hidden rounded-xl border border-border/60">
            {/*
              TODO: Add next/image back when we have our own S3 bucket for images.
              */}
            <img
              src={getCoverImage(trip?.destination?.imagesUrls)}
              alt={`${tripTitle} destination`}
              className="h-24 w-full object-cover sm:h-27.5"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" />
            <p className="absolute left-2 top-2 rounded-md border border-destructive/80 bg-red-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
              Ongoing
            </p>
          </div>

          <div className="min-w-0 flex flex-col gap-4 items-stretch justify-start sm:flex-row sm:items-end sm:justify-between sm:gap-0">
            <div>
              <h4 className="truncate text-lg font-semibold text-foreground">
                {tripTitle}
              </h4>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPinIcon className="size-3.5" />
                {tripDestinationLabel}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {trip.hasFlights && <TripFeatureBadge variant="flights" />}

                {trip.hasHotel && <TripFeatureBadge variant="hotel" />}

                {trip.hasItinerary && <TripFeatureBadge variant="itinerary" />}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {tripMessage}
              </p>
            </div>

            <Button size="sm" className="gap-1.5">
              Continue trip chat
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
