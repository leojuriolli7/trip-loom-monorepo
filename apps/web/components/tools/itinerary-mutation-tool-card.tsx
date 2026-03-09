"use client";

import type { TripLoomToolCall } from "@trip-loom/agents";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import {
  createSavedItinerarySheetData,
  itinerarySheetAtom,
} from "@/components/itinerary-sheet";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToolCallProgress } from "@/hooks/use-tool-call-progress";
import { itineraryQueries } from "@/lib/api/react-query/itineraries";

type ItineraryMutationToolCardProps = {
  toolCall: TripLoomToolCall;
};

function getCardLabels(toolName: string) {
  switch (toolName) {
    case "create_itinerary":
      return {
        loadingText: "Creating your itinerary...",
        title: "Created your itinerary",
        description: "Your itinerary has been saved and is ready to view.",
        buttonText: "See created itinerary",
      };
    case "add_itinerary_day":
      return {
        loadingText: "Adding a day...",
        title: "Added a new day",
        description: "A new day has been added to your itinerary.",
        buttonText: "See updated itinerary",
      };
    case "add_itinerary_activity":
      return {
        loadingText: "Adding an activity...",
        title: "Added a new activity",
        description: "A new activity has been added to your itinerary.",
        buttonText: "See updated itinerary",
      };
    case "update_itinerary_activity":
      return {
        loadingText: "Updating activity...",
        title: "Updated activity",
        description: "An activity in your itinerary has been updated.",
        buttonText: "See updated itinerary",
      };
    case "delete_itinerary_activity":
      return {
        loadingText: "Removing activity...",
        title: "Removed activity",
        description: "An activity has been removed from your itinerary.",
        buttonText: "See updated itinerary",
      };
    default:
      return {
        loadingText: "Updating your itinerary...",
        title: "Updated your itinerary",
        description: "Your itinerary has been updated and is ready to view.",
        buttonText: "See updated itinerary",
      };
  }
}

export function ItineraryMutationToolCard({
  toolCall,
}: ItineraryMutationToolCardProps) {
  const setItinerarySheet = useSetAtom(itinerarySheetAtom);
  const { isInProgress } = useToolCallProgress(toolCall.id);
  const labels = getCardLabels(toolCall.name);

  const tripId =
    "tripId" in toolCall.args ? (toolCall.args.tripId as string) : "";

  const { data: itineraryResult } = useQuery({
    ...itineraryQueries.getTripItinerary(tripId),
    enabled: !isInProgress && !!tripId,
  });

  const itinerary = itineraryResult?.data;

  const handleOpenItinerary = () => {
    if (!itinerary) return;

    setItinerarySheet({
      isOpen: true,
      itinerary: createSavedItinerarySheetData(itinerary),
    });
  };

  return (
    <ToolCallCard
      size="lg"
      className="bg-linear-to-br from-card via-card to-primary/5"
    >
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/calendar.png" alt="Map" />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            {isInProgress ? labels.loadingText : labels.title}
          </ToolCallCard.Title>

          {!isInProgress && (
            <ToolCallCard.Description>
              {labels.description}
            </ToolCallCard.Description>
          )}
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="flex items-center justify-between">
        {isInProgress ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>Working on it...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {itinerary && (
                <>
                  <Badge variant="outline">
                    {itinerary.days.length}{" "}
                    {itinerary.days.length === 1 ? "day" : "days"}
                  </Badge>

                  <Badge variant="outline">
                    {itinerary.days.reduce(
                      (sum, day) => sum + day.activities.length,
                      0,
                    )}{" "}
                    activities
                  </Badge>
                </>
              )}
            </div>

            {itinerary && (
              <ToolCallCard.Button onClick={handleOpenItinerary}>
                {labels.buttonText}
              </ToolCallCard.Button>
            )}
          </>
        )}
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
