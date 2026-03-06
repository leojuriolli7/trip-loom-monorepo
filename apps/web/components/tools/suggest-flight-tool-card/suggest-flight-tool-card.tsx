"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { SuggestedFlightCard } from "./suggested-flight-card";

type SuggestFlightToolCardProps = {
  args: TripLoomToolArgsByName<"suggest_flight">;
};

export function SuggestFlightToolCard({ args }: SuggestFlightToolCardProps) {
  const flights = args.flights;

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.HeaderContent className="space-y-1 pt-0">
          <ToolCallCard.Title>Flight options ready</ToolCallCard.Title>

          <ToolCallCard.Description>
            {`Found ${flights?.length} flight${flights?.length === 1 ? "" : "s"} for you to compare`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {flights?.map((flight, index) => (
            <div key={flight?.id || index} className="max-w-sm">
              <SuggestedFlightCard flight={flight} />
            </div>
          ))}
        </div>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
