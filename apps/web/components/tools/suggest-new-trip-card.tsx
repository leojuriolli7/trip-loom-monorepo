"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, PlusIcon } from "lucide-react";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { apiClient } from "@/lib/api/api-client";
import { parseIsoDate } from "@/lib/parse-iso-date";
import { tripQueries } from "@/lib/api/react-query/trips";
import { Spinner } from "../ui/spinner";

type SuggestNewTripArgs = TripLoomToolArgsByName<"suggest_new_trip">;

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate) return null;

  const start = parseIsoDate(startDate);

  if (!endDate) return format(start, "MMM d");

  const end = parseIsoDate(endDate);

  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }

  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

/**
 * TODO: When context exists (destination, dates), ideally clicking this card
 * should auto-submit a planning prompt in the new chat (e.g. via MCP prompt
 * or app-level prompt like `/chat/:id?prompt=plan_new_trip`). This requires
 * studying MCP prompt integration with LangChain. For now, both cases just
 * redirect to the new trip chat.
 */
export function SuggestNewTripCard({ args }: { args: SuggestNewTripArgs }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const hasContext = args.destinationName || args.title;
  const dateRange = formatDateRange(args.startDate, args.endDate);

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const body: Record<string, string> = {};

      if (args.title) body.title = args.title;
      if (args.destinationId) body.destinationId = args.destinationId;
      if (args.startDate) body.startDate = args.startDate;
      if (args.endDate) body.endDate = args.endDate;

      const result = await apiClient.api.trips.post(body);

      if (result.error || !result.data?.id) {
        throw new Error("Could not create trip");
      }

      void queryClient.invalidateQueries({ queryKey: tripQueries.base() });
      router.push(`/chat/${result.data.id}`);
      // TODO: This should also update conversation state: Record that a trip was created here
    } finally {
      setIsCreating(false);
    }
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
        <ToolCallCard.Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <Spinner className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}

          {isCreating ? "Creating..." : "Start planning"}
        </ToolCallCard.Button>
      </ToolCallCard.Footer>
    </ToolCallCard>
  );
}
