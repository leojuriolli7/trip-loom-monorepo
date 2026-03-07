"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ChevronRightIcon, MapPinIcon } from "lucide-react";
import { Ratings } from "@/components/ui/rating";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { amenityLabels } from "@/lib/labels/amenity-labels";
import { StreamingImage } from "@/components/streaming-image";

type SuggestedHotel =
  TripLoomToolArgsByName<"suggest_hotel_booking">["hotels"][number];

function formatNightlyRate(pricePerNight: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(pricePerNight);
  } catch {
    return `${currency?.toUpperCase()} ${pricePerNight}`;
  }
}

function getAmenitiesCountLabel(count: number) {
  if (count === 1) {
    return "1 amenity";
  }

  return `${count} amenities`;
}

export function SuggestedHotelCard({ hotel }: { hotel: SuggestedHotel }) {
  const amenities = hotel?.amenities ?? [];
  const amenitiesCount = amenities.length;

  return (
    <article className="flex h-full min-h-80 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="relative aspect-16/10 overflow-hidden">
        <StreamingImage
          src={hotel?.imageUrl || "/placeholder.png"}
          alt={hotel?.name || "Hotel image"}
          fill
          sizes="(max-width: 768px) 80vw, 40vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="line-clamp-2 text-base font-semibold leading-tight tracking-tight">
          {hotel?.name}
        </h4>

        <div className="mt-1 flex items-center gap-2">
          {typeof hotel?.starRating === "number" && (
            <Ratings rating={hotel.starRating} />
          )}

          <span className="text-xs text-muted-foreground">
            {hotel?.starRating?.toFixed(1)}
          </span>
        </div>

        {!!hotel?.location ? (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="line-clamp-1">{hotel?.location}</span>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {!!hotel?.pricePerNight && !!hotel?.currency ? (
            <p className="text-sm font-semibold text-foreground">
              {formatNightlyRate(hotel?.pricePerNight, hotel?.currency)}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                /night
              </span>
            </p>
          ) : null}

          {amenitiesCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {getAmenitiesCountLabel(amenitiesCount)}
                  <ChevronRightIcon className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="max-w-56 p-4"
              >
                <div className="space-y-1.5">
                  {amenities.map((amenity) => (
                    <p
                      key={`${hotel?.id}-tooltip-${amenity}`}
                      className="text-md text-background/90 capitalize"
                    >
                      {amenityLabels[amenity]}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </article>
  );
}
