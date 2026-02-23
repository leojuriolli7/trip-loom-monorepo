import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import { TripFeatureBadge } from "./trip-feature-badge";
import { Button } from "./ui/button";
import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { getCoverImage } from "@/lib/get-cover-image";

type CurrentTripCardProps = {
  trip: TripWithDestinationDTO;
  onContinue?: () => void;
};

export function CurrentTripCard({ trip, onContinue }: CurrentTripCardProps) {
  const tripTitle = trip?.title ?? trip?.destination?.name ?? "Current trip";

  const tripDestinationLabel = trip?.destination
    ? `${trip.destination.name}, ${trip.destination.country}`
    : "Destination being finalized";

  return (
    <div className="group relative mb-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 via-card to-chart-2/10 shadow-[0_18px_30px_-28px_rgba(15,23,42,0.8)]">
      <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-primary/16 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 size-36 rounded-full bg-chart-2/18 blur-3xl" />

      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="grid gap-3 p-3 sm:grid-cols-[130px_1fr] sm:items-center sm:gap-4">
          <div className="relative overflow-hidden rounded-xl border border-border/60">
            <Image
              src={getCoverImage(trip?.destination?.imagesUrls)}
              alt={`${tripTitle} destination`}
              width={520}
              height={220}
              sizes="(max-width: 640px) 100vw, 130px"
              className="h-24 w-full object-cover sm:h-27.5"
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
            </div>

            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={onContinue}
            >
              Continue trip chat
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
