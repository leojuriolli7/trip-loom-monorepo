import Image from "next/image";
import Link from "next/link";
import { MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SharedTripDTO } from "@trip-loom/contracts/dto";
import { formatTripDates } from "@/lib/format-trip-dates";

type SharedTripHeaderProps = {
  trip: SharedTripDTO;
};

export function SharedTripHeader({ trip }: SharedTripHeaderProps) {
  const coverImage = trip.destination?.imagesUrls?.find((img) => img.isCover);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card">
      {coverImage ? (
        <div className="relative h-48 w-full sm:h-64">
          <Image
            src={coverImage.url}
            alt={trip.destination?.name ?? "Trip destination"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        </div>
      ) : (
        <div className="h-20 w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
      )}

      <div className={`relative px-6 pb-6 ${coverImage ? "-mt-16" : "pt-6"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              data-testid="shared-trip-title"
            >
              {trip.title ?? "Untitled Trip"}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {trip.destination && (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5" />
                  {trip.destination.name}, {trip.destination.country}
                </span>
              )}

              {(trip.startDate || trip.endDate) && (
                <span>{formatTripDates(trip.startDate, trip.endDate)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
