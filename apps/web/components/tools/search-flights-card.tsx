import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";

type SearchFlightsToolCardProps = {
  args: TripLoomToolArgsByName<"search_flights">;
};

function formatSearchFlightsSummary(
  args: TripLoomToolArgsByName<"search_flights">,
) {
  const parts: string[] = [];

  if (args.from && args.to) {
    parts.push(`from ${args.from} to ${args.to}`);
  }

  if (args.date) {
    parts.push(`on ${args.date}`);
  }

  if (args.cabinClass && args.cabinClass !== "economy") {
    parts.push(`in ${args.cabinClass}`);
  }

  if (parts.length === 0) {
    return "Searched available flights";
  }

  return `Searched flights ${parts.join(" ")}`;
}

export function SearchFlightsToolCard({ args }: SearchFlightsToolCardProps) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src="/magnifying-glass.png"
          alt="Magnifying glass"
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Looked up flights</ToolCallCard.Title>
          <ToolCallCard.Description>
            {formatSearchFlightsSummary(args)}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
