"use client";

import { pluralize } from "@/lib/pluralize";
import type { ItineraryDetailDTO } from "@trip-loom/contracts/dto";
import { atom, useAtom } from "jotai";
import Image from "next/image";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ActiveMapView, ItinerarySheetData } from "./types";
import { ItineraryDay } from "./itinerary-day/itinerary-day";
import { ItineraryMapDialog } from "./itinerary-map-dialog";

type ItinerarySheetAtomValue = {
  itinerary: ItinerarySheetData | null;
  isOpen: boolean;
};

export const itinerarySheetAtom = atom<ItinerarySheetAtomValue>({
  itinerary: null,
  isOpen: false,
});

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
        imageUrl: activity.imageUrl,
        sourceUrl: activity.sourceUrl,
        sourceName: activity.sourceName,
        googlePlaceId: activity.googlePlaceId,
        googlePlaceDisplayName: activity.googlePlaceDisplayName,
        googleMapsUrl: activity.googleMapsUrl,
        googleFormattedAddress: activity.googleFormattedAddress,
        googleLat: activity.googleLat,
        googleLng: activity.googleLng,
        googlePlaceImageUrl: activity.googlePlaceImageUrl,
      })),
    })),
  };
}

export function ItinerarySheet() {
  const [{ itinerary, isOpen }, setItinerarySheetAtom] =
    useAtom(itinerarySheetAtom);

  const [activeMapView, setActiveMapView] = useState<ActiveMapView | null>(
    null,
  );

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

    if (!nextOpen) {
      setActiveMapView(null);
    }
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
              <ItineraryDay
                day={day}
                key={day.id}
                onClickOpenMap={setActiveMapView}
              />
            ))}
          </div>
        </div>
      </SheetContent>

      <ItineraryMapDialog
        clearMapState={() => setActiveMapView(null)}
        mapState={activeMapView}
      />
    </Sheet>
  );
}
