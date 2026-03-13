"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClockIcon } from "lucide-react";
import { googleMapsQueries } from "@/lib/api/react-query/google-maps";
import { Badge } from "@/components/ui/badge";
import { ItineraryPlaceCardDialog } from "./itinerary-place-card-dialog";
import type { ItineraryMapPlace } from "./types";

type ItineraryPlaceCardProps = {
  place: ItineraryMapPlace;
};

function getTimeLabel(place: ItineraryMapPlace) {
  if (place.startTime && place.endTime) {
    return `${place.startTime} - ${place.endTime}`;
  }

  return place.startTime ?? place.endTime ?? null;
}

export function ItineraryPlaceCard({ place }: ItineraryPlaceCardProps) {
  const timeLabel = getTimeLabel(place);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const prefetchPlaceDetails = () => {
    void queryClient.prefetchQuery(
      googleMapsQueries.getPlaceDetails(place.placeId),
    );
  };

  return (
    <>
      <article
        onMouseEnter={prefetchPlaceDetails}
        onTouchStart={prefetchPlaceDetails}
        onClick={() => setIsDialogOpen(true)}
        onFocusCapture={prefetchPlaceDetails}
        className="w-60 cursor-pointer hover:bg-card/70 overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-3 text-left shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] backdrop-blur-md"
      >
        {place.imageUrl ? (
          // eslint-disable-next-line
          <img
            src={place.imageUrl}
            alt={place.displayName ?? place.title}
            className="h-28 w-full rounded-xl object-cover transition-transform duration-500 group-hover/image:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}

        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="mt-3 block text-left transition-opacity hover:opacity-85"
        >
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Day {place.dayNumber}
            </p>
            <h4 className="text-sm font-semibold leading-tight text-foreground">
              {place.title}
            </h4>
            {place.displayName ? (
              <p className="text-xs font-medium text-foreground/80">
                {place.displayName}
              </p>
            ) : null}
            {place.address ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {place.address}
              </p>
            ) : null}
          </div>
        </button>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {timeLabel ? (
            <Badge variant="outline" className="bg-background/80">
              <ClockIcon className="size-3.5 shrink-0" />
              {timeLabel}
            </Badge>
          ) : null}
        </div>
      </article>

      <ItineraryPlaceCardDialog
        dayId={place.dayId}
        placeId={place.placeId}
        title={place.displayName ?? place.title}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
