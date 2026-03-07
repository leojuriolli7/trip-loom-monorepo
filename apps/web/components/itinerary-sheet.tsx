"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { pluralize } from "@/lib/pluralize";
import type { ItineraryDetailDTO } from "@trip-loom/contracts/dto";
import { format } from "date-fns";
import { atom, useAtom } from "jotai";
import { ClockIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { parseIsoDate } from "@/lib/parse-iso-date";

type SuggestedItineraryArgs = TripLoomToolArgsByName<"suggest_itinerary">;

export type ItinerarySheetActivity = {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
};

export type ItinerarySheetDay = {
  id: string;
  dayNumber: number;
  date: string | null;
  title: string | null;
  notes: string | null;
  activities: ItinerarySheetActivity[];
};

export type ItinerarySheetData = {
  source: "suggested" | "saved";
  days: ItinerarySheetDay[];
};

type ItinerarySheetAtomValue = {
  itinerary: ItinerarySheetData | null;
  isOpen: boolean;
};

export const itinerarySheetAtom = atom<ItinerarySheetAtomValue>({
  itinerary: null,
  isOpen: false,
});

function formatItineraryDateLabel(date: string | null | undefined) {
  if (!date) {
    return "Date pending";
  }

  const parsedDate = parseIsoDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return format(parsedDate, "EEEE, MMM d");
}

function getActivityTimeLabel(activity: ItinerarySheetActivity) {
  if (activity.startTime && activity.endTime) {
    return `${activity.startTime} - ${activity.endTime}`;
  }

  return activity.startTime ?? activity.endTime ?? null;
}

export function createSuggestedItinerarySheetData(
  itinerary: SuggestedItineraryArgs,
): ItinerarySheetData {
  return {
    source: "suggested",
    days: itinerary.days.map((day, dayIndex) => ({
      id: `suggested-day-${day.dayNumber}-${day.date ?? dayIndex}`,
      dayNumber: day.dayNumber,
      date: day.date ?? null,
      title: null,
      notes: null,
      activities: day.activities.map((activity, activityIndex) => ({
        id: `suggested-activity-${day.dayNumber}-${activityIndex}`,
        title: activity.name,
        description: activity.description ?? null,
        startTime: activity.startTime ?? null,
        endTime: activity.endTime ?? null,
        location: activity.location ?? null,
      })),
    })),
  };
}

export function createSavedItinerarySheetData(
  itinerary: ItineraryDetailDTO,
): ItinerarySheetData {
  return {
    source: "saved",
    days: itinerary.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
      title: day.title,
      notes: day.notes,
      activities: day.activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        startTime: activity.startTime,
        endTime: activity.endTime,
        location: activity.location,
      })),
    })),
  };
}

export function ItinerarySheet() {
  const [{ itinerary, isOpen }, setItinerarySheetAtom] =
    useAtom(itinerarySheetAtom);

  if (!itinerary) {
    return null;
  }

  const totalActivities = itinerary.days.reduce(
    (sum, day) => sum + day.activities.length,
    0,
  );

  const title =
    itinerary.source === "suggested" ? "Suggested itinerary" : "Trip itinerary";
  const description =
    itinerary.source === "suggested"
      ? `A day-by-day draft with ${totalActivities} activities ready to review`
      : `${pluralize(itinerary.days.length, "day")} with ${pluralize(
          totalActivities,
          "activity",
          "activities",
        )} currently planned`;

  function onOpenChange(nextOpen: boolean) {
    setItinerarySheetAtom((prev) => ({
      ...prev,
      isOpen: nextOpen,
    }));
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 max-w-none! data-[side=right]:w-[min(96vw,1400px)] data-[side=right]:md:w-[82vw] data-[side=right]:xl:w-[68vw] data-[side=right]:2xl:w-[62vw]"
      >
        <SheetHeader className="relative gap-4 overflow-hidden border-b border-border/60 py-6">
          <div className="relative flex items-start gap-4">
            <div className="relative size-16 shrink-0 rounded-2xl border border-border/60 bg-background/75 p-2">
              <Image
                src="/calendar.png"
                alt=""
                fill
                sizes="64px"
                className="object-contain scale-110"
              />
            </div>

            <div className="space-y-1">
              <SheetTitle className="text-left text-xl font-semibold tracking-tight">
                {title}
              </SheetTitle>
              <SheetDescription className="text-left leading-relaxed">
                {description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-linear-to-b from-background to-secondary/20 px-4 py-5 md:px-7 md:py-6 [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto space-y-5">
            {itinerary.days.map((day) => (
              <section
                key={day.id}
                className="relative overflow-hidden rounded-3xl bg-card/95 ring-1 ring-border/55 shadow-[0_14px_12px_-22px_rgba(15,23,42,0.7)]"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-primary/90 to-primary/25" />

                <div className="px-4 py-4 pl-6 md:px-6 md:py-5 md:pl-8">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatItineraryDateLabel(day.date)}
                    </p>
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

                      return (
                        <article
                          key={activity.id}
                          className="rounded-2xl px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
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

                          {timeLabel || activity.location ? (
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
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
