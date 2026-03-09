"use client";

import { useState } from "react";
import type { ToolApprovalInterrupt } from "@trip-loom/agents";
import { useSetAtom } from "jotai";
import {
  type ItinerarySheetData,
  itinerarySheetAtom,
} from "@/components/itinerary-sheet";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ItineraryApprovalCardProps = {
  interrupt: ToolApprovalInterrupt;
  disabled?: boolean;
  onApprove: () => void;
  onReject: (message?: string) => void;
};

type CreateItineraryDay = {
  dayNumber: number;
  date?: string;
  title?: string;
  notes?: string;
  activities?: CreateItineraryActivity[];
};

type CreateItineraryActivity = {
  orderIndex: number;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  imageUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
};

function getCardInfo(toolName: string) {
  switch (toolName) {
    case "create_itinerary":
      return {
        title: "Create itinerary",
        description: "Review the proposed itinerary before saving.",
      };
    case "add_itinerary_day":
      return {
        title: "Add a day",
        description: "A new day will be added to your itinerary.",
      };
    case "add_itinerary_activity":
      return {
        title: "Add an activity",
        description: "A new activity will be added to your itinerary.",
      };
    case "update_itinerary_activity":
      return {
        title: "Update activity",
        description: "An activity in your itinerary will be updated.",
      };
    case "delete_itinerary_activity":
      return {
        title: "Delete activity",
        description: "An activity will be removed from your itinerary.",
      };
    default:
      return {
        title: "Itinerary change",
        description: "Review this change before it's applied.",
      };
  }
}

/**
 * Builds ItinerarySheetData from create_itinerary tool args
 * so the user can preview the full itinerary in the sheet.
 */
function buildSheetDataFromArgs(
  args: Record<string, unknown>,
): ItinerarySheetData | null {
  const days = args.days as CreateItineraryDay[] | undefined;
  if (!days || days.length === 0) return null;

  return {
    source: "suggested",
    days: days.map((day, dayIndex) => ({
      id: `approval-day-${day.dayNumber}-${day.date ?? dayIndex}`,
      dayNumber: day.dayNumber,
      date: day.date ?? null,
      title: day.title ?? null,
      notes: day.notes ?? null,
      activities: (day.activities ?? []).map((activity, activityIndex) => ({
        id: `approval-activity-${day.dayNumber}-${activityIndex}`,
        title: activity.title,
        description: activity.description ?? null,
        startTime: activity.startTime ?? null,
        endTime: activity.endTime ?? null,
        location: activity.location ?? null,
        imageUrl: activity.imageUrl ?? null,
        sourceUrl: activity.sourceUrl ?? null,
        sourceName: activity.sourceName ?? null,
      })),
    })),
  };
}

export function ItineraryApprovalCard({
  interrupt,
  disabled,
  onApprove,
  onReject,
}: ItineraryApprovalCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const setItinerarySheet = useSetAtom(itinerarySheetAtom);

  const { title, description } = getCardInfo(interrupt.toolName);
  const args = interrupt.args;

  const sheetData =
    interrupt.toolName === "create_itinerary"
      ? buildSheetDataFromArgs(args)
      : null;

  const days = (args.days ?? []) as CreateItineraryDay[];
  const totalActivities = days.reduce(
    (sum, day) => sum + (day.activities?.length ?? 0),
    0,
  );

  const handlePreview = () => {
    if (!sheetData) return;
    setItinerarySheet({ isOpen: true, itinerary: sheetData });
  };

  const handleReject = () => {
    onReject(feedback || undefined);
  };

  return (
    <ToolCallCard size="lg" className="border-none shadow-none bg-transparent">
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/calendar.png" alt="Calendar" />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>{title}</ToolCallCard.Title>
          <ToolCallCard.Description>{description}</ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="space-y-3">
        {interrupt.toolName === "create_itinerary" && days.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{days.length} days</Badge>
            <Badge variant="outline">{totalActivities} activities</Badge>
          </div>
        )}

        {interrupt.toolName === "add_itinerary_day" && !!args.date && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Day {String(args.dayNumber)}</Badge>
            <Badge variant="outline">{String(args.date)}</Badge>
            {!!args.title && (
              <Badge variant="outline">{String(args.title)}</Badge>
            )}
          </div>
        )}

        {(interrupt.toolName === "add_itinerary_activity" ||
          interrupt.toolName === "update_itinerary_activity") &&
          !!args.title && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{String(args.title)}</Badge>
              {!!args.location && (
                <Badge variant="outline">{String(args.location)}</Badge>
              )}
              {!!args.startTime && (
                <Badge variant="outline">{String(args.startTime)}</Badge>
              )}
            </div>
          )}

        {showFeedback && (
          <Textarea
            placeholder="What would you like changed?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={disabled} onClick={onApprove} size="sm">
            Approve
          </Button>

          {sheetData && (
            <ToolCallCard.Button onClick={handlePreview}>
              Preview itinerary
            </ToolCallCard.Button>
          )}

          <Button
            disabled={disabled}
            onClick={showFeedback ? handleReject : () => setShowFeedback(true)}
            size="sm"
            variant="outline"
          >
            {showFeedback ? "Send feedback" : "Reject"}
          </Button>
        </div>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
