import { ClockIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <article className="w-60 rounded-3xl border border-border/70 bg-card/95 p-3 text-left shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] backdrop-blur-md">
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {timeLabel ? (
          <Badge variant="outline" className="bg-background/80">
            <ClockIcon className="size-3.5 shrink-0" />
            {timeLabel}
          </Badge>
        ) : null}
      </div>

      {place.mapsUrl ? (
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-75"
        >
          Open in Google Maps
          <ExternalLinkIcon className="size-3.5" />
        </a>
      ) : null}
    </article>
  );
}
