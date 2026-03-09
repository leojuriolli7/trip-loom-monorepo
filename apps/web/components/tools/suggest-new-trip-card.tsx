"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { useRouter } from "next/navigation";
import { CalendarIcon, MapPinIcon, PlusIcon } from "lucide-react";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { formatTripDates } from "@/lib/format-trip-dates";

type SuggestNewTripArgs = TripLoomToolArgsByName<"suggest_new_trip">;

export function SuggestNewTripCard({ args }: { args: SuggestNewTripArgs }) {
  const router = useRouter();

  const hasContext = args.destinationName || args.title;
  const dateRange = formatTripDates(args.startDate, args.endDate);

  const redirectToChatPage = async () => {
    const { destinationName, startDate, endDate } = args || {};

    // If there's relevant context, route to /chat page with the
    // destination name and dates, for structured prompt.
    if (destinationName) {
      const params = new URLSearchParams();
      params.set("from", "suggest-new-trip-card");

      if (destinationName) {
        params.set("destinationName", destinationName);
      }

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set("endDate", endDate);
      }

      router.push("/chat" + "?" + params.toString());
      return;
    }

    router.push("/chat");
  };

  return (
    <ToolCallCard size="lg">
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src={hasContext ? "/luggage.png" : "/compass.png"}
          alt={hasContext ? "New trip" : "Start a new trip"}
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            {hasContext
              ? (args.title ?? `Trip to ${args.destinationName}`)
              : "Ready for a new adventure?"}
          </ToolCallCard.Title>

          {args.destinationName || dateRange ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {args.destinationName && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3.5" />
                  {args.destinationName}
                </span>
              )}

              {dateRange && (
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  {dateRange}
                </span>
              )}
            </div>
          ) : (
            <ToolCallCard.Description>
              Start planning your next trip
            </ToolCallCard.Description>
          )}
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Footer>
        <ToolCallCard.Button onClick={redirectToChatPage}>
          <PlusIcon className="size-4" />
          Start planning
        </ToolCallCard.Button>
      </ToolCallCard.Footer>
    </ToolCallCard>
  );
}
