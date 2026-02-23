import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { useMemo } from "react";
import { format } from "date-fns";
import { TripFeatureBadge } from "@/components/trip-feature-badge";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { getCoverImage } from "@/lib/get-cover-image";

interface TripCardProps {
  trip: TripWithDestinationDTO;
}

export function TripCard({ trip }: TripCardProps) {
  const tripTitle =
    trip.title ?? trip.destination?.name ?? "Destination pending";

  const destinationPlace = `${trip.destination?.name}, ${trip.destination?.country}`;
  const hasAnyFeature = trip.hasFlights || trip.hasHotel || trip.hasItinerary;

  /**
   * Formats date string to `Jan 3 - Feb 4` or `Dec 14 - Jan 24 2027`
   */
  const dateRange = useMemo(() => {
    const startDate = trip?.startDate;
    const endDate = trip?.endDate;

    if (!startDate || !endDate) {
      return "Dates pending";
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getFullYear() !== end.getFullYear()) {
      return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
    }

    return `${format(start, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  }, [trip]);

  return (
    <Card className="group cursor-pointer overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-card to-secondary/25 p-0 shadow-[0_18px_28px_-24px_rgba(15,23,42,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_30px_42px_-26px_rgba(209,116,49,0.35)]">
      <div className="relative aspect-4/3 overflow-hidden">
        <Image
          src={getCoverImage(trip.destination?.imagesUrls)}
          alt={tripTitle}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          fetchPriority="high"
          loading="eager"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/78 via-black/22 to-transparent" />
        <div className="absolute right-3 top-3">
          <TripStatusBadge status={trip.status} />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">
            {tripTitle}
          </h3>

          <div className="mt-1 flex items-center">
            <div className="flex items-center gap-1.5 text-white/85">
              <MapPinIcon className="size-3.5" />
              <span className="text-sm font-medium">{destinationPlace}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 p-4 pt-0">
        <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-2.5 py-1.5 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" />
          <span className="font-medium">{dateRange}</span>
        </div>

        <div className="flex min-h-7 flex-wrap gap-2">
          {trip.hasFlights && <TripFeatureBadge variant="flights" />}
          {trip.hasHotel && <TripFeatureBadge variant="hotel" />}
          {trip.hasItinerary && <TripFeatureBadge variant="itinerary" />}
          {!hasAnyFeature && (
            <span className="text-xs text-muted-foreground">
              {"You haven't planned the trip yet, let's plan!"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
