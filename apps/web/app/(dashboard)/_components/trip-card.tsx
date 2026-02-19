import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import type { TripWithDestinationDTO } from "@trip-loom/api/dto";
import { useMemo } from "react";
import { format } from "date-fns";
import { TripFeatureBadge } from "@/components/trip-feature-badge";

interface TripCardProps {
  trip: TripWithDestinationDTO;
}

export function TripCard({ trip }: TripCardProps) {
  const tripTitle =
    trip.title ?? trip.destination?.name ?? "Destination pending";

  const destinationCountry = trip.destination?.country ?? "Country pending";

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
    <Card className="group cursor-pointer overflow-hidden border-border/60 p-0 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-4/3 overflow-hidden">
        {/* TODO: Add next/image back after images are on my CDN */}
        <img
          src={trip.destination?.imageUrl ?? "/placeholder.png"}
          alt={tripTitle}
          // fill
          fetchPriority="high"
          loading="eager"
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        {trip.status === "current" && (
          <Badge className="absolute right-3 top-3 border-0 bg-primary font-medium text-primary-foreground shadow-lg">
            Ongoing
          </Badge>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm">
            {tripTitle}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-white/85">
            <MapPinIcon className="size-3.5" />
            <span className="text-sm font-medium">{destinationCountry}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" />
          <span className="font-medium">{dateRange}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {trip.hasFlights && <TripFeatureBadge variant="flights" />}
          {trip.hasHotel && <TripFeatureBadge variant="hotel" />}
          {trip.hasItinerary && <TripFeatureBadge variant="itinerary" />}
        </div>
      </CardContent>
    </Card>
  );
}
