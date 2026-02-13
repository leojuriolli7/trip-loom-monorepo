import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MapPinIcon,
  PlaneIcon,
  BedDoubleIcon,
  MapIcon,
} from "lucide-react";
import Image from "next/image";

export interface Trip {
  id: string;
  destination: string;
  country: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "past" | "ongoing";
  hasFlights?: boolean;
  hasHotel?: boolean;
  hasItinerary?: boolean;
}

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${startDate.toLocaleDateString("en-US", { ...options, year: "numeric" })} - ${endDate.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
    }

    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  };

  return (
    <Card className="group cursor-pointer overflow-hidden border-border/60 p-0 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={trip.imageUrl}
          alt={trip.destination}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {trip.status === "ongoing" && (
          <Badge className="absolute right-3 top-3 border-0 bg-primary font-medium text-primary-foreground shadow-lg">
            Ongoing
          </Badge>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm">
            {trip.destination}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-white/85">
            <MapPinIcon className="size-3.5" />
            <span className="text-sm font-medium">{trip.country}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" />
          <span className="font-medium">
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {trip.hasFlights && (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-secondary/80 text-xs font-medium"
            >
              <PlaneIcon className="size-3" />
              Flights
            </Badge>
          )}
          {trip.hasHotel && (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-secondary/80 text-xs font-medium"
            >
              <BedDoubleIcon className="size-3" />
              Hotel
            </Badge>
          )}
          {trip.hasItinerary && (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-secondary/80 text-xs font-medium"
            >
              <MapIcon className="size-3" />
              Itinerary
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
