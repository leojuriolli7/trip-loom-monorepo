"use client";

import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { PlaneTakeoffIcon, PlaneLandingIcon } from "lucide-react";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { SuggestedFlightCard } from "./suggested-flight-card";

type SuggestFlightToolCardProps = {
  args: TripLoomToolArgsByName<"suggest_flight">;
};

type SuggestedFlight =
  TripLoomToolArgsByName<"suggest_flight">["flights"][number];

function FlightGrid({ flights }: { flights: SuggestedFlight[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {flights.map((flight, index) => (
        <div key={flight?.id || index} className="max-w-sm">
          <SuggestedFlightCard flight={flight} />
        </div>
      ))}
    </div>
  );
}

function FlightSection({
  label,
  icon,
  flights,
}: {
  label: string;
  icon: React.ReactNode;
  flights: SuggestedFlight[];
}) {
  if (flights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <FlightGrid flights={flights} />
    </div>
  );
}

export function SuggestFlightToolCard({ args }: SuggestFlightToolCardProps) {
  const flights = args.flights;

  const outbound = flights?.filter((f) => f?.type === "outbound") ?? [];
  const inbound = flights?.filter((f) => f?.type === "inbound") ?? [];
  const hasGroups = outbound.length > 0 && inbound.length > 0;

  const description = hasGroups
    ? `Found ${outbound.length} outbound and ${inbound.length} return flight${inbound.length === 1 ? "" : "s"}`
    : `Found ${flights?.length} flight${flights?.length === 1 ? "" : "s"} for you to compare`;

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.HeaderContent className="space-y-1 pt-0">
          <ToolCallCard.Title>Flight options ready</ToolCallCard.Title>
          <ToolCallCard.Description>{description}</ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content>
        {hasGroups ? (
          <div className="space-y-5">
            <FlightSection
              label="Outbound"
              icon={<PlaneTakeoffIcon className="size-4" />}
              flights={outbound}
            />
            <FlightSection
              label="Return"
              icon={<PlaneLandingIcon className="size-4" />}
              flights={inbound}
            />
          </div>
        ) : (
          <FlightGrid flights={flights ?? []} />
        )}
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}
