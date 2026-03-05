"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { format } from "date-fns";
import { ClockIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { parseIsoDate } from "@/lib/parse-iso-date";
import { Badge } from "@/components/ui/badge";

type SuggestedItineraryArgs = TripLoomToolArgsByName<"suggest_itinerary">;
type SuggestedItineraryDay = SuggestedItineraryArgs["days"][number];
type SuggestedItineraryActivity = SuggestedItineraryDay["activities"][number];

type ItineraryToolCardProps = {
  args: SuggestedItineraryArgs;
};

function formatItineraryDateLabel(date: string | undefined) {
  if (!date) {
    return "Date pending";
  }

  const parsedDate = parseIsoDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return format(parsedDate, "EEEE, MMM d");
}

function getActivityTimeLabel(activity: SuggestedItineraryActivity) {
  const startTime = activity.startTime;
  const endTime = activity.endTime;

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime ?? endTime ?? null;
}

export function ItineraryToolCard({ args }: ItineraryToolCardProps) {
  const itinerary = args;

  const totalActivities = itinerary.days.reduce(
    (sum, day) => sum + day.activities.length,
    0,
  );

  return (
    <Sheet>
      <ToolCallCard className="bg-linear-to-br from-card via-card to-primary/5">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/map.png" alt="" size="lg" />

          <div className="space-y-1 mt-2">
            <ToolCallCard.Title>Built your itinerary draft</ToolCallCard.Title>
            <ToolCallCard.Description>
              {`Prepared ${itinerary.days.length} days with ${totalActivities} activities for your review`}
            </ToolCallCard.Description>
          </div>
        </ToolCallCard.Header>

        <ToolCallCard.Content className="flex justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="m-0">
              {itinerary.days.length} days
            </Badge>

            <Badge variant="outline">{totalActivities} activities</Badge>
          </div>

          <SheetTrigger asChild>
            <ToolCallCard.Button>See suggested itinerary</ToolCallCard.Button>
          </SheetTrigger>
        </ToolCallCard.Content>
      </ToolCallCard>

      <SheetContent
        side="right"
        className="p-0 max-w-none! data-[side=right]:w-[min(96vw,1400px)] data-[side=right]:md:w-[82vw] data-[side=right]:xl:w-[68vw] data-[side=right]:2xl:w-[62vw]"
      >
        <SheetHeader className="relative gap-4 overflow-hidden border-b border-border/60 py-6">
          <div className="relative flex items-start gap-4">
            <div className="relative size-16 shrink-0 rounded-2xl border border-border/60 bg-background/75 p-2">
              <Image
                src="/map.png"
                alt=""
                fill
                sizes="64px"
                className="object-contain scale-110"
              />
            </div>

            <div className="space-y-1">
              <SheetTitle className="text-left text-xl font-semibold tracking-tight">
                Suggested itinerary
              </SheetTitle>
              <SheetDescription className="text-left leading-relaxed">
                {`A day-by-day draft with ${totalActivities} activities ready to review.`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-linear-to-b from-background to-secondary/20 px-4 py-5 md:px-7 md:py-6 [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto space-y-5">
            {itinerary.days.map((day) => (
              <section
                key={`${day.dayNumber}-${day.date ?? "pending"}`}
                className="relative overflow-hidden rounded-3xl bg-card/95 ring-1 ring-border/55 shadow-[0_14px_12px_-22px_rgba(15,23,42,0.7)]"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-primary/90 to-primary/25" />

                <div className="px-4 py-4 pl-6 md:px-6 md:py-5 md:pl-8">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatItineraryDateLabel(day.date)}
                    </p>
                  </header>

                  <div className="mt-4 space-y-3">
                    {day.activities.length === 0 && (
                      <p className="rounded-2xl bg-background/80 px-4 py-3 text-sm text-muted-foreground ring-1 ring-border/40">
                        No activities planned for this day yet.
                      </p>
                    )}

                    {day.activities.map((activity, index) => {
                      const timeLabel = getActivityTimeLabel(activity);

                      return (
                        <article
                          key={`${day.dayNumber}-${activity.name}-${index}`}
                          className="rounded-2xl px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                                {activity.name}
                              </h4>

                              {activity.description && (
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {(timeLabel || activity.location) && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {timeLabel && (
                                <Badge variant="outline">
                                  <ClockIcon className="size-3.5 shrink-0" />
                                  {timeLabel}
                                </Badge>
                              )}

                              {activity.location && (
                                <Badge variant="outline">
                                  <MapPinIcon className="size-3.5 shrink-0" />
                                  {activity.location}
                                </Badge>
                              )}
                            </div>
                          )}
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
