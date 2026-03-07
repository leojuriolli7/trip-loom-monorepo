"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { useSetAtom } from "jotai";
import {
  createSuggestedItinerarySheetData,
  itinerarySheetAtom,
} from "@/components/itinerary-sheet";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToolCallProgress } from "@/hooks/use-tool-call-progress";

type SuggestedItineraryArgs = TripLoomToolArgsByName<"suggest_itinerary">;

type ItineraryToolCardProps = {
  args: SuggestedItineraryArgs;
  toolCallId?: string;
};

export function SuggestedItineraryToolCard({
  args,
  toolCallId,
}: ItineraryToolCardProps) {
  const setItinerarySheetAtom = useSetAtom(itinerarySheetAtom);
  const { isInProgress } = useToolCallProgress(toolCallId);
  const itinerary = args;

  // Args may be partially streamed — guard against missing days
  const days = itinerary?.days ?? [];
  const totalActivities = days.reduce(
    (sum, day) => sum + (day.activities?.length ?? 0),
    0,
  );
  const isReady = !isInProgress && days.length > 0;

  const handleOpenItinerary = () => {
    if (!isReady) return;

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
          <ToolCallCard.Title>
            {isReady
              ? "Built your itinerary draft"
              : "Building your itinerary..."}
          </ToolCallCard.Title>

          {isReady && (
            <ToolCallCard.Description>
              {`Prepared ${days.length} days with ${totalActivities} activities for your review`}
            </ToolCallCard.Description>
          )}
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="flex items-center justify-between">
        {!isReady ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>Working on it...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="m-0">
                {days.length} days
              </Badge>

              <Badge variant="outline">{totalActivities} activities</Badge>
            </div>

            <ToolCallCard.Button onClick={handleOpenItinerary}>
              See suggested itinerary
            </ToolCallCard.Button>
          </>
        )}
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
