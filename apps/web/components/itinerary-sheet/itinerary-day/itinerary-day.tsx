"use client";

import { MapCtaCard } from "../map-cta-card";
import { ClockIcon, ExternalLinkIcon, MapIcon, MapPinIcon } from "lucide-react";
import { Badge } from "../../ui/badge";
import { ActiveMapView, ItinerarySheetDay } from "../types";
import {
  formatItineraryDateLabel,
  getActivitySourceLabel,
  getActivityTimeLabel,
} from "./utils";
import { pluralize } from "@/lib/pluralize";
import { getActivityMapPlace, getDayMapPlaces } from "../utils";
import { ItineraryMapPlace } from "@/components/itinerary-map/types";
import { parseIsoDate } from "@/lib/parse-iso-date";
import { format } from "date-fns";

function toMapState(day: ItinerarySheetDay, places: ItineraryMapPlace[]) {
  return {
    title: day.title ?? `Day ${day.dayNumber} map`,
    description: `${pluralize(places.length, "mapped stop")} for ${formatItineraryDateLabel(day.date)}`,
    places: places,
  };
}

export function ItineraryDay({
  onClickOpenMap,
  day,
}: {
  day: ItinerarySheetDay;
  onClickOpenMap: (mapState: ActiveMapView) => void;
}) {
  const dayMapPlaces = getDayMapPlaces(day);

  const handleMapOpen = () => {
    onClickOpenMap(toMapState(day, dayMapPlaces));
  };

  const handleOpenMapOnActivity = (coords: google.maps.LatLngLiteral) => {
    onClickOpenMap({
      ...toMapState(day, dayMapPlaces),
      initialPosition: coords,
    });
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-card/95 ring-1 ring-border/55 shadow-[0_14px_12px_-22px_rgba(15,23,42,0.7)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-primary/90 to-primary/25" />

      <div className="px-4 py-4 pl-6 md:px-6 md:py-5 md:pl-8">
        <>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {formatItineraryDateLabel(day.date)}
            </p>

            {/*{dayMapPlaces.length > 0 ? (
              <MapCtaCard onClick={handleMapOpen} />
            ) : null}*/}
          </header>

          {day.title ? (
            <p className="mt-2 text-base font-semibold tracking-tight text-foreground">
              {day.title}
            </p>
          ) : null}

          {day.notes ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {day.notes}
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {day.activities.length === 0 ? (
              <p className="rounded-2xl bg-background/80 px-4 py-3 text-sm text-muted-foreground ring-1 ring-border/40">
                No activities planned for this day yet.
              </p>
            ) : null}

            {day.activities.map((activity) => {
              const timeLabel = getActivityTimeLabel(activity);
              const sourceLabel = getActivitySourceLabel(activity);
              const place = getActivityMapPlace(day, activity);

              return (
                <article key={activity.id} className="rounded-2xl px-4 py-3">
                  <div className="flex items-start gap-4">
                    {activity.imageUrl ? (
                      <div className="size-14 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-muted/40">
                        {/* eslint-disable-next-line @next/next/no-img-element -- itinerary thumbnails come from arbitrary third-party sources */}
                        <img
                          src={activity.imageUrl}
                          alt={activity.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                        {activity.title}
                      </h4>

                      {activity.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {activity.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {timeLabel ||
                  activity.location ||
                  activity.sourceUrl ||
                  place ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {timeLabel ? (
                        <Badge variant="outline">
                          <ClockIcon className="size-3.5 shrink-0" />
                          {timeLabel}
                        </Badge>
                      ) : null}

                      {activity.location ? (
                        <Badge variant="outline">
                          <MapPinIcon className="size-3.5 shrink-0" />
                          {activity.location}
                        </Badge>
                      ) : null}

                      {place ? (
                        <Badge
                          onClick={() =>
                            handleOpenMapOnActivity({
                              lat: activity.googleLat!,
                              lng: activity.googleLng!,
                            })
                          }
                          variant="outline"
                          className="cursor-pointer select-none hover:text-accent-foreground transition-colors hover:bg-accent"
                        >
                          <MapIcon className="size-3.5 shrink-0" />
                          View on map
                        </Badge>
                      ) : null}

                      {activity.sourceUrl ? (
                        <Badge asChild variant="outline">
                          <a
                            href={activity.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLinkIcon className="size-3.5 shrink-0" />
                            {sourceLabel ?? "Source"}
                          </a>
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      </div>
    </section>
  );
}
