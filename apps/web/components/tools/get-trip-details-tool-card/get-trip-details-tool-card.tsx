"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { useQuery } from "@tanstack/react-query";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";
import { useToolCallProgress } from "@/hooks/use-tool-call-progress";
import { tripQueries } from "@/lib/api/react-query/trips";
import { formatTripDates } from "@/lib/format-trip-dates";
import { useOpenTripDetailsSheet } from "@/components/trip-details-sheet";
import { pluralize } from "@/lib/pluralize";
import {
  getTripActivityCount,
  getTripDestinationLabel,
} from "@/lib/trip-summary";
import { getCoverImage } from "@/lib/get-cover-image";

type GetTripDetailsToolCardProps = {
  args: TripLoomToolArgsByName<"get_trip_details">;
  toolCallId?: string;
};

export function GetTripDetailsToolCard({
  args,
  toolCallId,
}: GetTripDetailsToolCardProps) {
  const openTripDetailsSheet = useOpenTripDetailsSheet();
  const { isInProgress } = useToolCallProgress(toolCallId);

  const {
    data: tripResult,
    isError,
    isPending,
  } = useQuery({
    ...tripQueries.getTripById(args.tripId),
    enabled: Boolean(args.tripId) && !isInProgress,
    staleTime: 0,
  });

  if (isInProgress) {
    return null;
  }

  if (isPending) {
    return null;
  }

  if (isError || tripResult?.error || !tripResult?.data) {
    return (
      <ToolCallCard>
        <ToolCallCard.Header>
          <ToolCallCard.Image
            src="/globe-glass.png"
            alt="Trip plans unavailable"
            className="rounded-2xl object-cover"
          />

          <ToolCallCard.HeaderContent className="pt-0.5">
            <ToolCallCard.Title>
              Looked up current trip plans
            </ToolCallCard.Title>
            <ToolCallCard.Description className="first-letter:normal">
              Could not load the latest trip snapshot.
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>
      </ToolCallCard>
    );
  }

  const trip = tripResult.data;
  const tripDates = formatTripDates(trip?.startDate, trip?.endDate);
  const totalActivities = getTripActivityCount(trip);
  const hasAnyFeature = trip.hasFlights || trip.hasHotel || trip.hasItinerary;

  return (
    <ToolCallCard
      size="lg"
      className="bg-linear-to-br from-card via-card to-primary/5"
    >
      <ToolCallCard.Header className="gap-4">
        <ToolCallCard.Image
          src={getCoverImage(trip?.destination?.imagesUrls, "/globe-glass.png")}
          alt={trip.destination?.name ?? "Trip plans"}
          className="rounded-2xl object-cover"
        />

        <ToolCallCard.HeaderContent className="min-w-0 space-y-3 pt-0.5">
          <div className="space-y-1">
            <ToolCallCard.Title>
              Looked up current trip plans
            </ToolCallCard.Title>
            <ToolCallCard.Description className="first-letter:normal">
              {`${getTripDestinationLabel(trip)}. ${tripDates}`}
            </ToolCallCard.Description>

            {!hasAnyFeature ? (
              <Badge variant="outline">Planning in progress</Badge>
            ) : null}
          </div>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {pluralize(trip.flightBookings.length, "flight")}
          </Badge>
          <Badge variant="outline">
            {trip.hotelBookings?.length
              ? pluralize(
                  trip.hotelBookings.length,
                  "hotel stay",
                  "hotel stays",
                )
              : "No hotel booked"}
          </Badge>
          <Badge variant="outline">
            {trip.itinerary?.days.length
              ? `${pluralize(
                  totalActivities,
                  "activity",
                  "activities",
                )} planned`
              : "No itinerary yet"}
          </Badge>
        </div>

        <ToolCallCard.Button onClick={() => openTripDetailsSheet(trip.id)}>
          Open trip details
        </ToolCallCard.Button>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
