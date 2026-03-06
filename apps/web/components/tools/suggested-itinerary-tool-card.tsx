"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { useSetAtom } from "jotai";
import {
  createSuggestedItinerarySheetData,
  itinerarySheetAtom,
} from "@/components/itinerary-sheet";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";

type SuggestedItineraryArgs = TripLoomToolArgsByName<"suggest_itinerary">;

type ItineraryToolCardProps = {
  args: SuggestedItineraryArgs;
};

export function SuggestedItineraryToolCard({ args }: ItineraryToolCardProps) {
  const setItinerarySheetAtom = useSetAtom(itinerarySheetAtom);
  const itinerary = args;

  const totalActivities = itinerary.days.reduce(
    (sum, day) => sum + day.activities.length,
    0,
  );

  const handleOpenItinerary = () => {
    setItinerarySheetAtom({
      isOpen: true,
      itinerary: createSuggestedItinerarySheetData(itinerary),
    });
  };

  return (
    <ToolCallCard
      size="lg"
      className="bg-linear-to-br from-card via-card to-primary/5"
    >
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/map.png" alt="Map" />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Built your itinerary draft</ToolCallCard.Title>
          <ToolCallCard.Description>
            {`Prepared ${itinerary.days.length} days with ${totalActivities} activities for your review`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="flex justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="m-0">
            {itinerary.days.length} days
          </Badge>

          <Badge variant="outline">{totalActivities} activities</Badge>
        </div>

        <ToolCallCard.Button onClick={handleOpenItinerary}>
          See suggested itinerary
        </ToolCallCard.Button>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
